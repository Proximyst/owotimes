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
  instructions: "",
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
const CONTEXT_MAX_LENGTH = 2000;

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
}

export function buildAiMessages(settings: AiSettings, request: AiTextRequest): ChatCompletionMessageParam[] {
  const system = [
    "You write one short line of text for a field in a printed newspaper.",
    "Reply with the text only: no quotes, no labels, no line breaks.",
    settings.instructions.trim() ? `Extra instructions from the editor: ${settings.instructions.trim()}` : "",
  ].filter(Boolean).join("\n");
  const user = [
    `Field: ${request.field}`,
    request.context.trim() ? `Context:\n${request.context.trim().slice(0, CONTEXT_MAX_LENGTH)}` : "",
    request.current ? `Current text (write something different): ${request.current}` : "",
  ].filter(Boolean).join("\n\n");
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

export async function generateText(settings: AiSettings, request: AiTextRequest): Promise<string> {
  const baseUrl = settings.baseUrl.trim();
  const client = new OpenAI({
    apiKey: settings.apiKey.trim(),
    baseURL: baseUrl,
    // The key belongs to the reader and the page calls the endpoint directly; there is no server.
    dangerouslyAllowBrowser: true,
    // Anthropic refuses direct browser requests unless this opt-in header is sent.
    defaultHeaders: new URL(baseUrl).hostname === "api.anthropic.com"
      ? { "anthropic-dangerous-direct-browser-access": "true" }
      : undefined,
  });
  const response = await client.chat.completions.create({
    model: settings.model.trim(),
    temperature: settings.temperature,
    messages: buildAiMessages(settings, request),
  });
  const text = response.choices[0]?.message?.content?.trim().replace(/^["“]|["”]$/g, "").trim() ?? "";
  if (!text) throw new Error("The model returned no text.");
  return text;
}
