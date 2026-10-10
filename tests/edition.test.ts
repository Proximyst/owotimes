import { describe, expect, test } from "bun:test";
import {
  addStory,
  createDefaultEdition,
  moveParagraph,
  moveStory,
  normalizeEdition,
  removeStory,
  updateLayout,
  updateStory,
  type Edition,
} from "../src/edition.ts";
import { createEditionStorage } from "../src/storage.ts";

const ids = (paragraphs: { id: string }[]) => paragraphs.map((paragraph) => paragraph.id);

describe("edition state", () => {
  test("starts with the OwO Times name, warm paper, and an editable story", () => {
    const edition = createDefaultEdition();

    expect(edition.name).toBe("OwO Times");
    expect(edition.paperColor).toMatch(/^#[0-9a-f]{6}$/i);
    expect(edition.stories).toHaveLength(1);
    expect(edition.stories[0].headline).toBeTruthy();
    expect(edition.stories[0].paragraphs.length).toBeGreaterThan(0);
  });

  test("normalizes incomplete or malformed edition data", () => {
    const edition = normalizeEdition({ name: "  Gazette  ", stories: [null, {}] });

    expect(edition.name).toBe("Gazette");
    expect(edition.paperColor).toBe(createDefaultEdition().paperColor);
    expect(edition.stories).toHaveLength(1);
    expect(edition.stories[0].headline).toBe("");
    expect(edition.stories[0].paragraphs).toEqual([]);
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

  test("allows a cleared byline", () => {
    const edition = normalizeEdition({ text: { byline: "" } });

    expect(edition.text.byline).toBe("");
  });

  test("keeps each story's kicker and gives stories without one the default kicker", () => {
    const edition = normalizeEdition({
      stories: [
        { id: "a", headline: "A", kicker: "Front page" },
        { id: "b", headline: "B" },
      ],
    });

    expect(edition.stories[0].kicker).toBe("Front page");
    expect(edition.stories[1].kicker).toBe(addStory(createDefaultEdition()).story.kicker);
  });

  test("keeps captions per story and gives stories without one the default caption", () => {
    const edition = normalizeEdition({
      stories: [
        { id: "a", headline: "A", caption: "Harbour at dawn" },
        { id: "b", headline: "B" },
      ],
    });

    expect(edition.stories[0].caption).toBe("Harbour at dawn");
    expect(edition.stories[1].caption).toBe(createDefaultEdition().stories[0].caption);
  });

  test("migrates a legacy body string into paragraphs split on blank lines", () => {
    const edition = normalizeEdition({
      stories: [{ id: "s", headline: "H", body: "First para.\n\nSecond para\nline two.\n\n  " }],
    });

    expect(edition.stories[0].paragraphs.map((paragraph) => paragraph.text)).toEqual([
      "First para.",
      "Second para\nline two.",
    ]);
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

  test("moves paragraphs within a story and across stories", () => {
    const edition = normalizeEdition({
      stories: [
        { id: "a", paragraphs: [{ id: "p1", text: "one" }, { id: "p2", text: "two" }] },
        { id: "b", paragraphs: [{ id: "p3", text: "three" }] },
      ],
    });

    const reordered = moveParagraph(edition, "p2", "a", "p1");
    expect(ids(reordered.stories[0].paragraphs)).toEqual(["p2", "p1"]);

    const crossed = moveParagraph(edition, "p1", "b", "p3");
    expect(ids(crossed.stories[0].paragraphs)).toEqual(["p2"]);
    expect(ids(crossed.stories[1].paragraphs)).toEqual(["p1", "p3"]);

    const appended = moveParagraph(edition, "p1", "b", null);
    expect(ids(appended.stories[1].paragraphs)).toEqual(["p3", "p1"]);
  });

  test("ignores paragraph drops onto themselves or unknown targets", () => {
    const edition = normalizeEdition({
      stories: [{ id: "a", paragraphs: [{ id: "p1", text: "one" }] }],
    });

    expect(moveParagraph(edition, "p1", "a", "p1")).toBe(edition);
    expect(moveParagraph(edition, "p1", "nowhere", null)).toBe(edition);
    expect(moveParagraph(edition, "p1", "a", "missing")).toBe(edition);
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
