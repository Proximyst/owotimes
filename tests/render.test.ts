import { describe, expect, test } from "bun:test";
import { buildNewspaperView, EMPTY_BODY, paginate, splittableWord, UNTITLED_HEADLINE, unitKey } from "../src/render.ts";
import { createDefaultEdition } from "../src/edition.ts";

describe("newspaper view model", () => {
  test("carries publication details, text, and story text through unchanged", () => {
    const edition = {
      ...createDefaultEdition(),
      name: "OwO <Times>",
      date: "1890-10-10",
      stories: [
        {
          id: "one",
          headline: "A <great> day",
          body: "Tea & crumpets",
          imageKey: "photo-1",
          caption: "Tea caption",
          kicker: "Front page",
          byline: "By the librarian",
          span: "full" as const,
          startsPage: false,
        },
        { id: "two", headline: "Second", body: "", imageKey: null, caption: "", kicker: "Kicker two", byline: "By two", span: "column" as const, startsPage: false },
      ],
    };
    const view = buildNewspaperView(edition, new Map([["photo-1", "blob:photo"]]));

    expect(view.name).toBe("OwO <Times>");
    expect(view.date).toBe("1890-10-10");
    expect(view.paperColor).toBe(edition.paperColor);
    expect(view.text).toEqual(edition.text);
    expect(view.pages[0].stories[0]).toEqual({
      id: "one",
      key: "one:0:0",
      isLead: true,
      isFull: true,
      continued: false,
      headline: "A <great> day",
      paragraphs: [{ index: 0, word: 0, text: "Tea & crumpets" }],
      imageUrl: "blob:photo",
      caption: "Tea caption",
      kicker: "Front page",
      byline: "By the librarian",
    });
    expect(view.pages[0].stories[1].isLead).toBe(false);
    expect(view.pages[0].stories[1].isFull).toBe(false);
  });

  test("falls back to a placeholder when the story text is blank", () => {
    const edition = createDefaultEdition();
    edition.stories[0].headline = "";
    edition.stories[0].body = "   ";
    const [story] = buildNewspaperView(edition).pages[0].stories;

    expect(story.headline).toBe(UNTITLED_HEADLINE);
    expect(story.paragraphs.map((piece) => piece.text)).toEqual([EMPTY_BODY]);
  });

  test("splits story text into paragraphs on blank lines", () => {
    const edition = createDefaultEdition();
    edition.stories[0].body = "First\n\nSecond";
    const [story] = buildNewspaperView(edition).pages[0].stories;

    expect(story.paragraphs.map((piece) => piece.text)).toEqual(["First", "Second"]);
  });

  test("leaves imageUrl null for stories without a resolved photo", () => {
    const edition = createDefaultEdition();
    edition.stories[0].imageKey = "missing";

    expect(buildNewspaperView(edition, new Map()).pages[0].stories[0].imageUrl).toBeNull();
    expect(buildNewspaperView(createDefaultEdition()).pages[0].stories[0].imageUrl).toBeNull();
  });

  test("resolves layout into CSS-ready values", () => {
    const edition = createDefaultEdition();
    edition.layout = { ...edition.layout, paperSize: "A3", columns: 3, bodySize: 12 };
    const { layout } = buildNewspaperView(edition);

    expect(layout.paperWidth).toBe("297mm");
    expect(layout.paperHeight).toBe("420mm");
    expect(layout.columns).toBe(3);
    expect(layout.bodySize).toBe("12pt");
    expect(layout.bodyFont).toContain("Playfair Display");
  });

  test("passes each story's own caption into its view", () => {
    const edition = {
      ...createDefaultEdition(),
      stories: [
        { id: "a", headline: "A", body: "", imageKey: "photo-1", caption: "Tea caption", kicker: "Kicker A", byline: "By A", span: "column" as const, startsPage: false },
        { id: "b", headline: "B", body: "", imageKey: "photo-2", caption: "Second caption", kicker: "Kicker B", byline: "By B", span: "column" as const, startsPage: false },
      ],
    };
    const view = buildNewspaperView(edition, new Map([["photo-1", "blob:one"], ["photo-2", "blob:two"]]));

    expect(view.pages[0].stories.map((story) => story.caption)).toEqual(["Tea caption", "Second caption"]);
  });

  test("starts a new page where a story asks for one", () => {
    const edition = createDefaultEdition();
    edition.stories = [
      { ...edition.stories[0], id: "a" },
      { ...edition.stories[0], id: "b", startsPage: true },
      { ...edition.stories[0], id: "c" },
    ];
    const { pages } = buildNewspaperView(edition);

    expect(pages.map((page) => page.number)).toEqual([1, 2]);
    expect(pages.map((page) => page.stories.map((story) => story.id))).toEqual([["a"], ["b", "c"]]);
  });

  test("flows a long story onto the next page with only its remaining paragraphs", () => {
    const edition = createDefaultEdition();
    edition.stories[0].body = "one\n\ntwo\n\nthree";
    const { stories } = buildNewspaperView(edition);
    const pages = paginate(stories, new Set([unitKey(stories[0].id, 2)]));

    expect(pages.map((page) => page.stories.map((story) => story.paragraphs.map((piece) => piece.text)))).toEqual([[["one", "two"]], [["three"]]]);
    expect(pages[1].stories[0]).toMatchObject({ continued: true, isLead: false });
  });

  test("a break before a story's first paragraph does not add an empty page", () => {
    const edition = createDefaultEdition();
    const { stories } = buildNewspaperView(edition);

    expect(paginate(stories, new Set([unitKey(stories[0].id, 0)]))).toHaveLength(1);
  });

  test("breaks a paragraph across pages at a word, and the rest continues without a header", () => {
    const edition = createDefaultEdition();
    edition.stories[0].body = "one two three four";
    const { stories } = buildNewspaperView(edition);
    const pages = paginate(stories, new Set([unitKey(stories[0].id, 0, 2)]));

    expect(pages.map((page) => page.stories[0].paragraphs)).toEqual([
      [{ index: 0, word: 0, text: "one two" }],
      [{ index: 0, word: 2, text: "three four" }],
    ]);
    expect(pages[1].stories[0]).toMatchObject({ continued: true });
  });

  test("never splits a paragraph inside bold or italic markup", () => {
    expect(splittableWord("a **bold text** end", 2)).toBe(1);
    expect(splittableWord("one two three", 2)).toBe(2);
    expect(splittableWord("*one two* three", 1)).toBe(0);
  });
});
