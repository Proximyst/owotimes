import { describe, expect, test } from "bun:test";
import { CAPTION_IDEAS, randomCaption } from "../src/captions.ts";

describe("random captions", () => {
  test("never returns the caption it replaces", () => {
    for (const current of CAPTION_IDEAS) {
      for (const roll of [0, 0.5, 0.999]) {
        expect(randomCaption(current, () => roll)).not.toBe(current);
      }
    }
  });

  test("can reach every other caption from the list", () => {
    const current = CAPTION_IDEAS[0];
    const rolls = Array.from({ length: 100 }, (_, i) => i / 100);
    const seen = new Set(rolls.map((roll) => randomCaption(current, () => roll)));

    expect(seen.size).toBe(CAPTION_IDEAS.length - 1);
    expect(seen.has(current)).toBe(false);
  });
});
