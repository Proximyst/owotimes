import { describe, expect, test } from "bun:test";
import { createDefaultEdition, editionContext, type Edition } from "../src/edition.ts";

const base = createDefaultEdition();

const edition: Edition = {
  ...base,
  name: "OwO Times",
  date: "1890-10-10",
  text: { ...base.text, banner: "BANNER LINE", footer: "FOOTER LINE" },
  stories: [
    {
      id: "s1",
      headline: "HEADLINE ONE",
      paragraphs: [{ id: "p1", text: "PARAGRAPH ONE" }],
      imageKey: null,
      caption: "CAPTION ONE",
      kicker: "KICKER ONE",
      byline: "BYLINE ONE",
      span: "column",
      startsPage: false,
    },
  ],
};

describe("AI context", () => {
  test("includes masthead, banner, footer, and every story's text", () => {
    const text = editionContext(edition);

    for (const expected of [
      "OwO Times",
      "1890-10-10",
      "BANNER LINE",
      "FOOTER LINE",
      "KICKER ONE",
      "HEADLINE ONE",
      "BYLINE ONE",
      "PARAGRAPH ONE",
      "CAPTION ONE",
    ]) {
      expect(text).toContain(expected);
    }
  });

  test("leaves out empty fields so the prompt has no blank lines", () => {
    const text = editionContext({ ...edition, stories: [] });

    expect(text.split("\n").every((line) => line.trim() !== "")).toBe(true);
  });
});
