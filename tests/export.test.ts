import { describe, expect, test } from "bun:test";
import { MAX_CANVAS_PIXELS, MAX_CANVAS_SIDE, exportFileName, exportPixelRatio } from "../src/export.ts";

describe("export pixel ratio", () => {
  test("renders a single A4-sized sheet at 2x", () => {
    expect(exportPixelRatio(794, 1123)).toBe(2);
  });

  test("lowers the ratio so a long strip stays within canvas limits", () => {
    const width = 794;
    const height = 1123 * 12 + 24 * 11;
    const ratio = exportPixelRatio(width, height);
    expect(ratio).toBeLessThan(2);
    // A tolerance of one pixel covers rounding when the canvas size is computed.
    expect(width * ratio).toBeLessThanOrEqual(MAX_CANVAS_SIDE + 1);
    expect(height * ratio).toBeLessThanOrEqual(MAX_CANVAS_SIDE + 1);
    expect(width * height * ratio * ratio).toBeLessThanOrEqual(MAX_CANVAS_PIXELS + 1);
  });
});

describe("export file names", () => {
  test("slugs the publication name, dropping accents", () => {
    expect(exportFileName("OwO Times", "page-1")).toBe("owo-times-page-1.png");
    expect(exportFileName("Café Times", "long")).toBe("cafe-times-long.png");
  });

  test("falls back when the name has no latin letters or digits", () => {
    expect(exportFileName("  ✦ ", "long")).toBe("newspaper-long.png");
  });
});
