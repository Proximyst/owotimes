import { DEFAULT_LAYOUT, normalizeLayout, type Layout } from "./layout.ts";
import { isRecord } from "./guards.ts";
import { BYLINE_IDEAS, CAPTION_IDEAS, KICKER_IDEAS, PRICE_IDEAS, TAGLINE_IDEAS, TOP_RIGHT_IDEAS, randomFrom } from "./pools.ts";

export type StorySpan = "column" | "full";

export interface Story {
  id: string;
  headline: string;
  body: string;
  imageKey: string | null;
  caption: string;
  kicker: string;
  byline: string;
  span: StorySpan;
  startsPage: boolean;
}

export type StoryChanges = Partial<Pick<Story, "headline" | "body" | "imageKey" | "span" | "caption" | "kicker" | "byline" | "startsPage">>;

export interface EditionText {
  topLeft: string;
  topRight: string;
  tagline: string;
  banner: string;
  footer: string;
}

export interface Edition {
  name: string;
  paperColor: string;
  date: string;
  text: EditionText;
  layout: Layout;
  stories: Story[];
}

const DEFAULT_COLOR = "#e9dfc8";

const BANNER = "Hot news from the village square, mined fresh daily";
const FOOTER = "Printed with a crafting table · Published by the villagers";

// Used when a saved edition lacks a field. New editions roll their text instead.
const FALLBACK_TEXT: EditionText = {
  topLeft: PRICE_IDEAS[0],
  topRight: TOP_RIGHT_IDEAS[0],
  tagline: TAGLINE_IDEAS[0],
  banner: BANNER,
  footer: FOOTER,
};

function rolledText(): EditionText {
  return {
    topLeft: randomFrom(PRICE_IDEAS),
    topRight: randomFrom(TOP_RIGHT_IDEAS),
    tagline: randomFrom(TAGLINE_IDEAS),
    banner: BANNER,
    footer: FOOTER,
  };
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function textOr(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

const LEAD_KICKER = "FRONT PAGE SCOOP";

function blankStory(): Story {
  return { id: makeId(), headline: "", body: "", imageKey: null, caption: randomFrom(CAPTION_IDEAS), kicker: randomFrom(KICKER_IDEAS), byline: randomFrom(BYLINE_IDEAS), span: "column", startsPage: false };
}

export function createDefaultEdition(): Edition {
  return {
    name: "OwO Times",
    paperColor: DEFAULT_COLOR,
    date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    text: rolledText(),
    layout: { ...DEFAULT_LAYOUT },
    stories: [
      {
        id: makeId(),
        headline: "Creeper Spotted Near the Wheat Fields",
        body: "A creeper was seen hissing near the wheat fields at dusk. Iron golems were dispatched at once, and the villagers report no damage beyond a few scorched carrots. The village librarian advises all readers to keep their torches lit.",
        imageKey: null,
        caption: randomFrom(CAPTION_IDEAS),
        kicker: LEAD_KICKER,
        byline: randomFrom(BYLINE_IDEAS),
        span: "column",
        startsPage: false,
      },
    ],
  };
}

function normalizeBody(story: Record<string, unknown>): string {
  // Editions saved with a paragraph list before story text existed join its paragraphs with blank lines.
  if (Array.isArray(story.paragraphs)) {
    return story.paragraphs.filter(isRecord).map((paragraph) => textOr(paragraph.text, "")).join("\n\n");
  }
  return textOr(story.body, "");
}

// Paragraphs are separated by blank lines. Each is trimmed, and empty ones are skipped.
export function storyParagraphs(body: string): string[] {
  return body.split(/\n\s*\n/).map((text) => text.trim()).filter((text) => text !== "");
}

function normalizeStory(story: Record<string, unknown>): Story {
  return {
    id: typeof story.id === "string" && story.id ? story.id : makeId(),
    headline: textOr(story.headline, ""),
    body: normalizeBody(story),
    imageKey: typeof story.imageKey === "string" ? story.imageKey : null,
    caption: textOr(story.caption, CAPTION_IDEAS[0]),
    kicker: textOr(story.kicker, KICKER_IDEAS[0]),
    byline: textOr(story.byline, BYLINE_IDEAS[0]),
    span: story.span === "full" ? "full" : "column",
    startsPage: story.startsPage === true,
  };
}

function normalizeText(input: unknown): EditionText {
  const record = isRecord(input) ? input : {};
  return {
    topLeft: textOr(record.topLeft, FALLBACK_TEXT.topLeft),
    topRight: textOr(record.topRight, FALLBACK_TEXT.topRight),
    tagline: textOr(record.tagline, FALLBACK_TEXT.tagline),
    banner: textOr(record.banner, FALLBACK_TEXT.banner),
    footer: textOr(record.footer, FALLBACK_TEXT.footer),
  };
}

export function normalizeEdition(input: unknown): Edition {
  const defaults = createDefaultEdition();
  if (!isRecord(input)) return defaults;
  const stories = Array.isArray(input.stories) ? input.stories.filter(isRecord).map(normalizeStory) : [];

  return {
    name: typeof input.name === "string" && input.name.trim() ? input.name.trim() : defaults.name,
    paperColor: typeof input.paperColor === "string" && /^#[\da-f]{6}$/i.test(input.paperColor) ? input.paperColor : defaults.paperColor,
    date: typeof input.date === "string" && input.date ? input.date : defaults.date,
    text: normalizeText(input.text),
    layout: normalizeLayout(input.layout),
    stories: stories.length ? stories : defaults.stories,
  };
}

export function addStory(edition: Edition): { edition: Edition; story: Story } {
  const story = blankStory();
  return { edition: { ...edition, stories: [...edition.stories, story] }, story };
}

export function updateStory(
  edition: Edition,
  id: string,
  changes: StoryChanges,
): Edition {
  return {
    ...edition,
    stories: edition.stories.map((story) => story.id === id ? { ...story, ...changes, id: story.id } : story),
  };
}

export function removeStory(edition: Edition, id: string): Edition {
  const stories = edition.stories.filter((story) => story.id !== id);
  return { ...edition, stories: stories.length ? stories : [blankStory()] };
}

// Moves a story so it sits before `beforeStoryId`, or last when null.
export function moveStory(edition: Edition, storyId: string, beforeStoryId: string | null): Edition {
  if (storyId === beforeStoryId) return edition;
  const moving = edition.stories.find((story) => story.id === storyId);
  if (!moving) return edition;
  const rest = edition.stories.filter((story) => story.id !== storyId);
  const at = beforeStoryId === null ? rest.length : rest.findIndex((story) => story.id === beforeStoryId);
  if (at === -1) return edition;
  return { ...edition, stories: [...rest.slice(0, at), moving, ...rest.slice(at)] };
}

export function updateLayout(edition: Edition, changes: Partial<Layout>): Edition {
  return { ...edition, layout: normalizeLayout({ ...edition.layout, ...changes }) };
}

export function updateText(edition: Edition, changes: Partial<EditionText>): Edition {
  return { ...edition, text: { ...edition.text, ...changes } };
}

// All newspaper text in reading order, for AI prompts: masthead, labels, footer, then each story.
export function editionContext(edition: Edition): string {
  const storyText = edition.stories.flatMap((story) => [
    story.kicker,
    story.headline,
    story.byline,
    story.body,
    story.caption,
  ]);
  return [edition.name, edition.date, ...Object.values(edition.text), ...storyText]
    .map((text) => text.trim())
    .filter((text) => text !== "")
    .join("\n");
}
