import { describe, expect, test } from "bun:test";
import {
  BYLINE_IDEAS,
  CAPTION_IDEAS,
  KICKER_IDEAS,
  PRICE_IDEAS,
  TAGLINE_IDEAS,
  TOP_RIGHT_IDEAS,
  randomFrom,
} from "../src/pools.ts";

const POOLS: Record<string, readonly string[]> = {
  kicker: KICKER_IDEAS,
  price: PRICE_IDEAS,
  topRight: TOP_RIGHT_IDEAS,
  tagline: TAGLINE_IDEAS,
  byline: BYLINE_IDEAS,
  caption: CAPTION_IDEAS,
};

describe("random text pools", () => {
  for (const [name, pool] of Object.entries(POOLS)) {
    test(`${name} has no duplicate texts`, () => {
      expect(new Set(pool).size).toBe(pool.length);
    });

    test(`${name} never rerolls to the text it replaces`, () => {
      for (const current of pool) {
        for (const roll of [0, 0.5, 0.999]) {
          expect(randomFrom(pool, current, () => roll)).not.toBe(current);
        }
      }
    });

    test(`${name} can reach every other text`, () => {
      const current = pool[0];
      const rolls = Array.from({ length: 200 }, (_, i) => i / 200);
      const seen = new Set(rolls.map((roll) => randomFrom(pool, current, () => roll)));

      expect(seen.size).toBe(pool.length - 1);
      expect(seen.has(current)).toBe(false);
    });
  }
});
