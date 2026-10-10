import { describe, expect, test } from "bun:test";
import {
  AI_PROVIDER_PRESETS,
  DEFAULT_AI_SETTINGS,
  buildAiMessages,
  isAiReady,
  isValidBaseUrl,
  normalizeAiSettings,
  type AiSettings,
  type AiStatus,
  generateText,
} from "../src/ai.ts";
import { createAiSettingsStorage } from "../src/storage.ts";

const READY: AiSettings = { ...DEFAULT_AI_SETTINGS, enabled: true, model: "model-x", apiKey: "sk-test" };

describe("AI settings", () => {
  test("clamps temperature and trims text fields on load", () => {
    const settings = normalizeAiSettings({ temperature: 9, model: "  model-x  ", apiKey: " sk-test " });

    expect(settings.temperature).toBe(2);
    expect(settings.model).toBe("model-x");
    expect(settings.apiKey).toBe("sk-test");
  });

  test("is ready only when enabled with a valid endpoint, model, and key", () => {
    expect(isAiReady(READY)).toBe(true);
    expect(isAiReady({ ...READY, enabled: false })).toBe(false);
    expect(isAiReady({ ...READY, apiKey: "   " })).toBe(false);
    expect(isAiReady({ ...READY, model: "" })).toBe(false);
    expect(isAiReady({ ...READY, baseUrl: "not a url" })).toBe(false);
  });

  test("each provider preset gives a usable endpoint and model, so only the key is left to enter", () => {
    for (const preset of AI_PROVIDER_PRESETS) {
      expect(isValidBaseUrl(preset.baseUrl)).toBe(true);
      expect(isAiReady({ ...READY, baseUrl: preset.baseUrl, model: preset.model })).toBe(true);
    }
  });

  test("puts the field, context, current text, and instructions into the prompt", () => {
    const messages = buildAiMessages(
      { ...READY, instructions: "Keep it rural" },
      { field: "Byline", current: "By old", context: "Headline: Crops" },
    );
    const text = messages.map((message) => message.content).join("\n");

    expect(text).toContain("Field: Byline");
    expect(text).toContain("Headline: Crops");
    expect(text).toContain("By old");
    expect(text).toContain("Keep it rural");
  });

  test("passes the reader's own prompt into the request", () => {
    const messages = buildAiMessages(READY, { field: "Story paragraph", current: "", context: "", prompt: "Write about the harvest" });
    const text = messages.map((message) => message.content).join("\n");

    expect(text).toContain("Request: Write about the harvest");
  });

  test("persists settings and reads them back through injected storage", () => {
    const backing = new Map<string, string>();
    const storage = {
      getItem: (key: string) => backing.get(key) ?? null,
      setItem: (key: string, value: string) => { backing.set(key, value); },
    };

    expect(createAiSettingsStorage(storage).save(READY)).toBe(true);
    expect(normalizeAiSettings(createAiSettingsStorage(storage).load())).toEqual(READY);
  });
});

describe("AI text requests", () => {
  // Serves the given responses in order, one per request, and counts the requests.
  function serve(replies: Response[]) {
    const requests = { count: 0 };
    const server = Bun.serve({
      port: 0,
      fetch() {
        requests.count += 1;
        return replies.shift() ?? new Response("unexpected request", { status: 500 });
      },
    });
    return { server, requests };
  }

  function sse(pieces: string[]): string {
    return pieces.map((piece) => `data: ${JSON.stringify({ choices: [{ delta: { content: piece } }] })}\n\n`).join("")
      + "data: [DONE]\n\n";
  }

  test("retries a server error, reports each attempt, and streams the reply", async () => {
    const { server, requests } = serve([
      new Response("busy", { status: 503 }),
      new Response(sse(["Brass ", "Byline"]), { headers: { "content-type": "text/event-stream" } }),
    ]);
    const statuses: AiStatus[] = [];
    try {
      const text = await generateText(
        { ...READY, baseUrl: `http://127.0.0.1:${server.port}/v1` },
        { field: "Byline", current: "", context: "" },
        (status) => statuses.push(status),
      );
      expect(text).toBe("Brass Byline");
      expect(requests.count).toBe(2);
      expect(statuses).toEqual([
        { phase: "waiting" },
        { phase: "retrying", attempt: 2, attempts: 3, reason: "HTTP 503" },
        { phase: "writing", tokens: 1 },
        { phase: "writing", tokens: 2 },
      ]);
    } finally {
      server.stop(true);
    }
  });

  test("does not retry a client error", async () => {
    const { server, requests } = serve([new Response("bad key", { status: 401 })]);
    try {
      await expect(
        generateText({ ...READY, baseUrl: `http://127.0.0.1:${server.port}/v1` }, { field: "Byline", current: "", context: "" }),
      ).rejects.toMatchObject({ status: 401 });
      expect(requests.count).toBe(1);
    } finally {
      server.stop(true);
    }
  });
});
