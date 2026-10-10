import { describe, expect, test } from "bun:test";
import { buildNewspaperView, EMPTY_BODY, UNTITLED_HEADLINE } from "../src/render.ts";
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
          paragraphs: [{ id: "p", text: "Tea & crumpets" }],
          imageKey: "photo-1",
          caption: "Tea caption",
          kicker: "Front page",
          span: "full" as const,
        },
        { id: "two", headline: "Second", paragraphs: [], imageKey: null, caption: "", span: "column" as const },
      ],
    };
    const view = buildNewspaperView(edition, new Map([["photo-1", "blob:photo"]]));

    expect(view.name).toBe("OwO <Times>");
    expect(view.date).toBe("1890-10-10");
    expect(view.paperColor).toBe(edition.paperColor);
    expect(view.text).toEqual(edition.text);
    expect(view.stories[0]).toEqual({
      id: "one",
      isLead: true,
      isFull: true,
      headline: "A <great> day",
      paragraphs: ["Tea & crumpets"],
      imageUrl: "blob:photo",
      caption: "Tea caption",
      kicker: "Front page",
    });
    expect(view.stories[1].isLead).toBe(false);
    expect(view.stories[1].isFull).toBe(false);
  });

  test("drops blank paragraphs and falls back to a placeholder when none remain", () => {
    const edition = createDefaultEdition();
    edition.stories[0].headline = "";
    edition.stories[0].paragraphs = [{ id: "a", text: "   " }];
    const [story] = buildNewspaperView(edition).stories;

    expect(story.headline).toBe(UNTITLED_HEADLINE);
    expect(story.paragraphs).toEqual([EMPTY_BODY]);
  });

  test("leaves imageUrl null for stories without a resolved photo", () => {
    const edition = createDefaultEdition();
    edition.stories[0].imageKey = "missing";

    expect(buildNewspaperView(edition, new Map()).stories[0].imageUrl).toBeNull();
    expect(buildNewspaperView(createDefaultEdition()).stories[0].imageUrl).toBeNull();
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
        { id: "a", headline: "A", paragraphs: [], imageKey: "photo-1", caption: "Tea caption", kicker: "Kicker A", span: "column" as const },
        { id: "b", headline: "B", paragraphs: [], imageKey: "photo-2", caption: "Second caption", kicker: "Kicker B", span: "column" as const },
      ],
    };
    const view = buildNewspaperView(edition, new Map([["photo-1", "blob:one"], ["photo-2", "blob:two"]]));

    expect(view.stories.map((story) => story.caption)).toEqual(["Tea caption", "Second caption"]);
  });
});
