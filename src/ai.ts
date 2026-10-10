import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { isRecord } from "./guards.ts";

// Bring-your-own-key settings. They live only in this browser and are never part of the edition.
export interface AiSettings {
  enabled: boolean;
  baseUrl: string;
  model: string;
  apiKey: string;
  temperature: number;
  instructions: string;
}

export const DEFAULT_AI_SETTINGS: AiSettings = {
  enabled: false,
  baseUrl: "https://api.openai.com/v1",
  model: "",
  apiKey: "",
  temperature: 1,
  instructions: "This newspaper is for a Minecraft server called 'OwO SMP', which is filled with adults. Keep the tone playful and affectionate toward the server, and refer to Minecraft life, builds, and server events where it fits.",
};

// One-click endpoint and model choices. The reader still supplies their own key.
export interface AiProviderPreset {
  id: string;
  label: string;
  baseUrl: string;
  model: string;
}

export const AI_PROVIDER_PRESETS: readonly AiProviderPreset[] = [
  { id: "openai", label: "OpenAI", baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" },
  { id: "openrouter", label: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", model: "z-ai/glm-5.3-flash" },
  { id: "anthropic", label: "Anthropic", baseUrl: "https://api.anthropic.com/v1/", model: "claude-sonnet-4-6" },
];

export const TEMPERATURE_RANGE = { min: 0, max: 2 } as const;
const TEXT_MAX_LENGTH = 500;
const INSTRUCTIONS_MAX_LENGTH = 1000;

function textOf(value: unknown, fallback: string, maxLength = TEXT_MAX_LENGTH): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : fallback;
}

export function normalizeAiSettings(input: unknown): AiSettings {
  if (!isRecord(input)) return { ...DEFAULT_AI_SETTINGS };
  const temperature = typeof input.temperature === "number" && Number.isFinite(input.temperature)
    ? Math.min(TEMPERATURE_RANGE.max, Math.max(TEMPERATURE_RANGE.min, input.temperature))
    : DEFAULT_AI_SETTINGS.temperature;
  return {
    enabled: input.enabled === true,
    baseUrl: textOf(input.baseUrl, DEFAULT_AI_SETTINGS.baseUrl),
    model: textOf(input.model, DEFAULT_AI_SETTINGS.model),
    apiKey: textOf(input.apiKey, DEFAULT_AI_SETTINGS.apiKey),
    temperature,
    instructions: textOf(input.instructions, DEFAULT_AI_SETTINGS.instructions, INSTRUCTIONS_MAX_LENGTH),
  };
}

export function isValidBaseUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

// AI buttons appear only when AI is switched on and everything needed to call the endpoint is set.
export function isAiReady(settings: AiSettings): boolean {
  return settings.enabled
    && isValidBaseUrl(settings.baseUrl)
    && settings.model.trim() !== ""
    && settings.apiKey.trim() !== "";
}

export interface AiTextRequest {
  // Human name of the field being filled, e.g. "Byline".
  field: string;
  // Text currently in the field, so the model writes something different.
  current: string;
  // What the newspaper or story is about.
  context: string;
  // What the reader asked for, when they typed a prompt.
  prompt?: string;
}

export function buildAiMessages(settings: AiSettings, request: AiTextRequest): ChatCompletionMessageParam[] {
  const system = [
    "You write one short line of text for a field in a printed newspaper.",
    "Reply with the text only: no quotes, no labels, no line breaks.",
    settings.instructions.trim() ? `Extra instructions from the editor: ${settings.instructions.trim()}` : "",
  ].filter(Boolean).join("\n");
  const user = [
    `Field: ${request.field}`,
    request.context.trim() ? `Context:\n${request.context.trim()}` : "",
    request.prompt?.trim() ? `Request: ${request.prompt.trim()}` : "",
    request.current ? `Current text (write something different): ${request.current}` : "",
  ].filter(Boolean).join("\n\n");
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

// What a request is doing, reported while it runs.
export type AiStatus =
  | { phase: "waiting" }
  | { phase: "retrying"; attempt: number; attempts: number; reason: string }
  | { phase: "writing"; tokens: number };

export type AiReport = (status: AiStatus) => void;

export const AI_ATTEMPTS = 3;
// Longest silence from the endpoint, before the reply starts or between streamed pieces, before an attempt is abandoned.
const IDLE_TIMEOUT_MS = 10_000;
const RETRY_DELAY_MS = 1_000;

// A failure worth another attempt. Its message is the reason the reader sees.
class RetryableFailure extends Error {}

function isRetryableStatus(status: number | undefined): boolean {
  return status === 408 || status === 409 || status === 429 || (status !== undefined && status >= 500);
}

function delay(ms: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve, ms);
  return promise;
}

export async function generateText(settings: AiSettings, request: AiTextRequest, report: AiReport = () => {}): Promise<string> {
  const baseUrl = settings.baseUrl.trim();
  const client = new OpenAI({
    apiKey: settings.apiKey.trim(),
    baseURL: baseUrl,
    // Retries happen below, so that each attempt can be reported to the reader.
    maxRetries: 0,
    // The key belongs to the reader and the page calls the endpoint directly; there is no server.
    dangerouslyAllowBrowser: true,
    // Anthropic refuses direct browser requests unless this opt-in header is sent.
    defaultHeaders: new URL(baseUrl).hostname === "api.anthropic.com"
      ? { "anthropic-dangerous-direct-browser-access": "true" }
      : undefined,
  });

  let failure: RetryableFailure | null = null;
  for (let attempt = 1; attempt <= AI_ATTEMPTS; attempt++) {
    if (failure) {
      report({ phase: "retrying", attempt, attempts: AI_ATTEMPTS, reason: failure.message });
      await delay(RETRY_DELAY_MS);
    } else {
      report({ phase: "waiting" });
    }
    try {
      return await streamReply(client, settings, request, report);
    } catch (error) {
      if (!(error instanceof RetryableFailure)) throw error;
      failure = error;
    }
  }
  throw new Error(`Gave up after ${AI_ATTEMPTS} attempts: ${failure?.message ?? "the request failed"}.`);
}

// One attempt. It is abandoned when the endpoint goes quiet for IDLE_TIMEOUT_MS, whether it has not
// replied yet or stops partway through the reply.
async function streamReply(client: OpenAI, settings: AiSettings, request: AiTextRequest, report: AiReport): Promise<string> {
  const controller = new AbortController();
  let silent = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const watch = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      silent = true;
      controller.abort();
    }, IDLE_TIMEOUT_MS);
  };

  let text = "";
  let tokens = 0;
  watch();
  try {
    const stream = await client.chat.completions.create({
      model: settings.model.trim(),
      temperature: settings.temperature,
      messages: buildAiMessages(settings, request),
      stream: true,
    }, { signal: controller.signal });
    for await (const chunk of stream) {
      watch();
      const piece = chunk.choices[0]?.delta?.content;
      if (!piece) continue;
      text += piece;
      tokens += 1;
      report({ phase: "writing", tokens });
    }
  } catch (error) {
    if (silent) throw new RetryableFailure(`no reply for ${IDLE_TIMEOUT_MS / 1000} seconds`);
    if (error instanceof OpenAI.APIConnectionError) throw new RetryableFailure("connection failed");
    if (error instanceof OpenAI.APIError && isRetryableStatus(error.status)) {
      throw new RetryableFailure(`HTTP ${error.status}`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }

  const reply = text.trim().replace(/^["“]|["”]$/g, "").trim();
  if (!reply) throw new Error("The model returned no text.");
  return reply;
}
