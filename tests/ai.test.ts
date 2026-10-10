import { describe, expect, test } from "bun:test";
import { DEFAULT_AI_SETTINGS, buildAiMessages, isAiReady, normalizeAiSettings, type AiSettings } from "../src/ai.ts";
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
