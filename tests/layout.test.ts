import { describe, expect, test } from "bun:test";
import { DEFAULT_LAYOUT, fontStack, normalizeLayout, paperDimensions, pageSizeCss } from "../src/layout.ts";

describe("paper size", () => {
  test("uses preset dimensions unless the paper is custom", () => {
    expect(paperDimensions({ ...DEFAULT_LAYOUT, paperSize: "A3" })).toEqual({ widthMm: 297, heightMm: 420 });
  });

  test("uses slider dimensions for a custom paper", () => {
    const layout = { ...DEFAULT_LAYOUT, paperSize: "Custom" as const, customWidthMm: 333, customHeightMm: 480 };

    expect(paperDimensions(layout)).toEqual({ widthMm: 333, heightMm: 480 });
  });

  test("produces an @page rule matching the paper dimensions", () => {
    expect(pageSizeCss({ widthMm: 333, heightMm: 480 })).toContain("size: 333mm 480mm");
  });

  test("clamps custom dimensions to the slider ranges", () => {
    const layout = normalizeLayout({ paperSize: "Custom", customWidthMm: 5000, customHeightMm: 10 });

    expect(layout.customWidthMm).toBe(600);
    expect(layout.customHeightMm).toBe(100);
  });
});

describe("fonts", () => {
  test("defaults to Playfair Display for text and Blackletter for the masthead", () => {
    expect(DEFAULT_LAYOUT.bodyFont).toBe("Playfair Display");
    expect(DEFAULT_LAYOUT.mastheadFont).toBe("UnifrakturMaguntia");
  });

  test("keeps custom font names as typed, including spaces", () => {
    expect(normalizeLayout({ bodyFont: "Iowan Old Style " }).bodyFont).toBe("Iowan Old Style ");
  });

  test("falls back to the default when a font value is not a string", () => {
    expect(normalizeLayout({ bodyFont: 42 }).bodyFont).toBe("Playfair Display");
  });

  test("builds a quoted font stack and strips characters that could break out of it", () => {
    expect(fontStack('Evil"; color: red')).toBe('"Evil color: red", Georgia, "Times New Roman", serif');
  });

  test("uses only the generic fallback stack for an empty name", () => {
    expect(fontStack("   ")).toBe('Georgia, "Times New Roman", serif');
  });
});

describe("layout normalization", () => {
  test("falls back to defaults for non-object input", () => {
    expect(normalizeLayout(null)).toEqual(normalizeLayout({}));
    expect(normalizeLayout("nonsense").paperSize).toBe("A4");
  });

  test("rejects non-numeric sizes", () => {
    const layout = normalizeLayout({ columns: "two", bodySize: Number.NaN });

    expect(layout.columns).toBe(2);
    expect(layout.bodySize).toBe(11);
  });
});
