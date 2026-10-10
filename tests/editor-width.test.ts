import { describe, expect, test } from "bun:test";
import { clampEditorWidth } from "../composables/useEditorWidth.ts";

describe("stories panel width", () => {
  test("keeps the panel at least 280px wide", () => {
    expect(clampEditorWidth(100, 1400)).toBe(280);
  });

  test("keeps the panel inside the window minus the shell inset on both sides", () => {
    expect(clampEditorWidth(5000, 1400)).toBe(1352);
  });

  test("passes widths inside the bounds through, rounded to whole pixels", () => {
    expect(clampEditorWidth(612.4, 1400)).toBe(612);
  });

  test("never goes below the minimum on a very narrow window", () => {
    expect(clampEditorWidth(900, 200)).toBe(280);
  });
});
