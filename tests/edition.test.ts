import { describe, expect, test } from "bun:test";
import {
  addStory,
  createDefaultEdition,
  storyParagraphs,
  moveStory,
  normalizeEdition,
  removeStory,
  updateLayout,
  updateStory,
  type Edition,
} from "../src/edition.ts";
import { createEditionStorage } from "../src/storage.ts";
import { CAPTION_IDEAS, KICKER_IDEAS } from "../src/pools.ts";

describe("edition state", () => {
  test("starts with the OwO Times name, warm paper, and an editable story", () => {
    const edition = createDefaultEdition();

    expect(edition.name).toBe("OwO Times");
    expect(edition.paperColor).toMatch(/^#[0-9a-f]{6}$/i);
    expect(edition.stories).toHaveLength(1);
    expect(edition.stories[0].headline).toBeTruthy();
    expect(edition.stories[0].body).toBeTruthy();
  });

  test("normalizes incomplete or malformed edition data", () => {
    const edition = normalizeEdition({ name: "  Gazette  ", stories: [null, {}] });

    expect(edition.name).toBe("Gazette");
    expect(edition.paperColor).toBe(createDefaultEdition().paperColor);
    expect(edition.stories).toHaveLength(1);
    expect(edition.stories[0].headline).toBe("");
    expect(edition.stories[0].body).toBe("");
  });

  test("clamps invalid layout values and keeps valid ones", () => {
    const { layout } = normalizeEdition({
      layout: { paperSize: "Broadsheet", columns: 9, bodySize: 3, bodyFont: "gill" },
    });

    expect(layout.paperSize).toBe("A4");
    expect(layout.columns).toBe(4);
    expect(layout.bodySize).toBe(8);
    expect(layout.bodyFont).toBe("gill");
    expect(layout.headlineFont).toBe("Playfair Display");
  });

  test("allows a cleared per-story byline", () => {
    const edition = normalizeEdition({ stories: [{ id: "a", headline: "A", byline: "" }] });

    expect(edition.stories[0].byline).toBe("");
  });

  test("keeps each story's kicker and gives stories without one a kicker from the pool", () => {
    const edition = normalizeEdition({
      stories: [
        { id: "a", headline: "A", kicker: "Front page" },
        { id: "b", headline: "B" },
      ],
    });

    expect(edition.stories[0].kicker).toBe("Front page");
    expect(KICKER_IDEAS as readonly string[]).toContain(edition.stories[1].kicker);
  });

  test("keeps captions per story and gives stories without one a caption from the pool", () => {
    const edition = normalizeEdition({
      stories: [
        { id: "a", headline: "A", caption: "Harbour at dawn" },
        { id: "b", headline: "B" },
      ],
    });

    expect(edition.stories[0].caption).toBe("Harbour at dawn");
    expect(CAPTION_IDEAS as readonly string[]).toContain(edition.stories[1].caption);
  });

  test("keeps the new-page flag per story and defaults it off", () => {
    const edition = normalizeEdition({
      stories: [{ id: "a", headline: "A", startsPage: true }, { id: "b", headline: "B" }],
    });

    expect(edition.stories.map((story) => story.startsPage)).toEqual([true, false]);
  });

  test("keeps a legacy body string as story text", () => {
    const edition = normalizeEdition({
      stories: [{ id: "s", headline: "H", body: "First para.\n\nSecond para\nline two.\n\n  " }],
    });

    expect(edition.stories[0].body).toBe("First para.\n\nSecond para\nline two.\n\n  ");
    expect(storyParagraphs(edition.stories[0].body)).toEqual(["First para.", "Second para\nline two."]);
  });

  test("joins saved paragraphs into the story text", () => {
    const edition = normalizeEdition({
      stories: [{ id: "s", paragraphs: [{ id: "p1", text: "one" }, { id: "p2", text: "two" }] }],
    });

    expect(edition.stories[0].body).toBe("one\n\ntwo");
  });

  test("keeps only the full-width span as a non-default story layout", () => {
    const edition = normalizeEdition({
      stories: [{ id: "a", span: "full" }, { id: "b", span: "sideways" }],
    });

    expect(edition.stories.map((story) => story.span)).toEqual(["full", "column"]);
  });

  test("adds, updates, and removes stories immutably", () => {
    const initial = createDefaultEdition();
    const added = addStory(initial);
    const edited = updateStory(added.edition, added.story.id, { headline: "Breaking news" });
    const removed = removeStory(edited, added.story.id);

    expect(added.edition.stories).toHaveLength(2);
    expect(edited.stories.find((story) => story.id === added.story.id)?.headline).toBe("Breaking news");
    expect(removed.stories).toHaveLength(1);
    expect(initial.stories).toHaveLength(1);
  });

  test("moves stories before a target or to the end", () => {
    const edition = normalizeEdition({ stories: [{ id: "a" }, { id: "b" }, { id: "c" }] });
    const order = (next: Edition) => next.stories.map((story) => story.id);

    expect(order(moveStory(edition, "c", "a"))).toEqual(["c", "a", "b"]);
    expect(order(moveStory(edition, "a", null))).toEqual(["b", "c", "a"]);
    expect(moveStory(edition, "a", "missing")).toBe(edition);
    expect(moveStory(edition, "a", "a")).toBe(edition);
  });

  test("updates layout fields without disturbing the rest", () => {
    const initial = createDefaultEdition();
    const next = updateLayout(initial, { paperSize: "A3" });

    expect(next.layout.paperSize).toBe("A3");
    expect(next.layout.columns).toBe(initial.layout.columns);
    expect(initial.layout.paperSize).toBe("A4");
  });

  test("persists settings through an injected storage adapter", () => {
    const values = new Map();
    const storage = createEditionStorage({
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    });
    const edition = { ...createDefaultEdition(), name: "The Evening OwO" };

    storage.saveEdition(edition);

    expect(storage.loadEdition().name).toBe("The Evening OwO");
  });
});
