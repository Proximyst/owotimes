import { describe, expect, test } from "bun:test";
import { normalizeEdition } from "../src/edition.ts";
import { DEFAULT_LAYOUT, normalizeLayout } from "../src/layout.ts";
import { CRUMPLE_METHODS, PAPER_COLOURS, crumpleBackground, type CrumpleMethod } from "../src/paper.ts";

const METHODS = Object.keys(CRUMPLE_METHODS) as CrumpleMethod[];

function reliefOf(amount: number, method: CrumpleMethod): number {
  const svg = decodeURIComponent(crumpleBackground(amount, method));
  return Number(/surfaceScale="([\d.]+)"/.exec(svg)?.[1]);
}

describe("paper colours", () => {
  test("every preset is accepted as the paper colour", () => {
    for (const colour of PAPER_COLOURS) {
      expect(normalizeEdition({ paperColor: colour.hex }).paperColor).toBe(colour.hex);
    }
  });
});

describe("paper crumple", () => {
  test("zero crumple leaves the paper flat for every method", () => {
    for (const method of METHODS) {
      expect(crumpleBackground(0, method)).toBe("none");
    }
  });

  test("more crumple gives deeper relief for every method", () => {
    for (const method of METHODS) {
      expect(reliefOf(100, method)).toBeGreaterThan(reliefOf(20, method));
    }
  });

  test("each method produces a different texture", () => {
    const textures = new Set(METHODS.map((method) => crumpleBackground(50, method)));
    expect(textures.size).toBe(METHODS.length);
  });

  test("amount and method are clamped or defaulted when invalid", () => {
    expect(normalizeLayout({ crumple: 250 }).crumple).toBe(100);
    expect(normalizeLayout({ crumple: -3 }).crumple).toBe(0);
    expect(normalizeLayout({}).crumple).toBe(DEFAULT_LAYOUT.crumple);
    expect(normalizeLayout({ crumpleMethod: "crinkle" }).crumpleMethod).toBe(DEFAULT_LAYOUT.crumpleMethod);
  });
});
