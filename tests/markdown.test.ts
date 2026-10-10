import { describe, expect, test } from "bun:test";
import { parseInline } from "../src/markdown.ts";

describe("inline markdown", () => {
  test("leaves plain text as one unstyled run", () => {
    expect(parseInline("Tea and crumpets")).toEqual([
      { text: "Tea and crumpets", bold: false, italic: false },
    ]);
  });

  test("styles bold and italic runs", () => {
    expect(parseInline("a **bold** and *slanted* word")).toEqual([
      { text: "a ", bold: false, italic: false },
      { text: "bold", bold: true, italic: false },
      { text: " and ", bold: false, italic: false },
      { text: "slanted", bold: false, italic: true },
      { text: " word", bold: false, italic: false },
    ]);
  });

  test("nests italic inside bold", () => {
    expect(parseInline("**a *b* c**")).toEqual([
      { text: "a ", bold: true, italic: false },
      { text: "b", bold: true, italic: true },
      { text: " c", bold: true, italic: false },
    ]);
  });

  test("keeps unpaired or spaced asterisks literal", () => {
    expect(parseInline("5 * 3 = 15 and 2*3")).toEqual([
      { text: "5 * 3 = 15 and 2*3", bold: false, italic: false },
    ]);
  });

  test("never interprets HTML", () => {
    expect(parseInline("<img src=x onerror=alert(1)>")).toEqual([
      { text: "<img src=x onerror=alert(1)>", bold: false, italic: false },
    ]);
  });
});
