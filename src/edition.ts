import { DEFAULT_LAYOUT, normalizeLayout, type Layout } from "./layout.ts";
import { isRecord } from "./guards.ts";

export interface Paragraph {
  id: string;
  text: string;
}

export type StorySpan = "column" | "full";

export interface Story {
  id: string;
  headline: string;
  paragraphs: Paragraph[];
  imageKey: string | null;
  caption: string;
  kicker: string;
  span: StorySpan;
}

export interface EditionText {
  topLeft: string;
  topRight: string;
  tagline: string;
  banner: string;
  footer: string;
  byline: string;
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

const DEFAULT_TEXT: EditionText = {
  topLeft: "PRICE 1 EMERALD",
  topRight: "THE VILLAGE'S PREMIERE NEWSPAPER",
  tagline: "THE TRUTHFUL CHRONICLE OF VILLAGE AFFAIRS",
  banner: "Hot news from the village square, mined fresh daily",
  footer: "Printed with a crafting table · Published by the villagers",
  byline: "By the village librarian",
};

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function textOr(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

const DEFAULT_CAPTION = "Sketched by the village cartographer";
const DEFAULT_KICKER = "FROM OUR VILLAGE CORRESPONDENTS";
const LEAD_KICKER = "FRONT PAGE SCOOP";

function blankStory(): Story {
  return { id: makeId(), headline: "", paragraphs: [], imageKey: null, caption: DEFAULT_CAPTION, kicker: DEFAULT_KICKER, span: "column" };
}

export function createDefaultEdition(): Edition {
  return {
    name: "OwO Times",
    paperColor: DEFAULT_COLOR,
    date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    text: { ...DEFAULT_TEXT },
    layout: { ...DEFAULT_LAYOUT },
    stories: [
      {
        id: makeId(),
        headline: "Creeper Spotted Near the Wheat Fields",
        paragraphs: [{
          id: makeId(),
          text: "A creeper was seen hissing near the wheat fields at dusk. Iron golems were dispatched at once, and the villagers report no damage beyond a few scorched carrots. The village librarian advises all readers to keep their torches lit.",
        }],
        imageKey: null,
        caption: DEFAULT_CAPTION,
        kicker: LEAD_KICKER,
        span: "column",
      },
    ],
  };
}

function normalizeParagraphs(story: Record<string, unknown>): Paragraph[] {
  if (Array.isArray(story.paragraphs)) {
    return story.paragraphs.filter(isRecord).map((paragraph) => ({
      id: typeof paragraph.id === "string" && paragraph.id ? paragraph.id : makeId(),
      text: textOr(paragraph.text, ""),
    }));
  }
  // Editions saved before paragraphs existed stored one `body` string.
  if (typeof story.body === "string") {
    return story.body
      .split(/\n\s*\n/)
      .map((text) => text.trim())
      .filter(Boolean)
      .map((text) => ({ id: makeId(), text }));
  }
  return [];
}

function normalizeStory(story: Record<string, unknown>): Story {
  return {
    id: typeof story.id === "string" && story.id ? story.id : makeId(),
    headline: textOr(story.headline, ""),
    paragraphs: normalizeParagraphs(story),
    imageKey: typeof story.imageKey === "string" ? story.imageKey : null,
    caption: textOr(story.caption, DEFAULT_CAPTION),
    kicker: textOr(story.kicker, DEFAULT_KICKER),
    span: story.span === "full" ? "full" : "column",
  };
}

function normalizeText(input: unknown): EditionText {
  const record = isRecord(input) ? input : {};
  return {
    topLeft: textOr(record.topLeft, DEFAULT_TEXT.topLeft),
    topRight: textOr(record.topRight, DEFAULT_TEXT.topRight),
    tagline: textOr(record.tagline, DEFAULT_TEXT.tagline),
    banner: textOr(record.banner, DEFAULT_TEXT.banner),
    footer: textOr(record.footer, DEFAULT_TEXT.footer),
    byline: textOr(record.byline, DEFAULT_TEXT.byline),
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
  changes: Partial<Pick<Story, "headline" | "imageKey" | "span" | "caption" | "kicker">>,
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

export function addParagraph(edition: Edition, storyId: string): Edition {
  return {
    ...edition,
    stories: edition.stories.map((story) => story.id === storyId
      ? { ...story, paragraphs: [...story.paragraphs, { id: makeId(), text: "" }] }
      : story),
  };
}

export function updateParagraph(edition: Edition, paragraphId: string, text: string): Edition {
  return {
    ...edition,
    stories: edition.stories.map((story) => ({
      ...story,
      paragraphs: story.paragraphs.map((paragraph) => paragraph.id === paragraphId ? { ...paragraph, text } : paragraph),
    })),
  };
}

export function removeParagraph(edition: Edition, paragraphId: string): Edition {
  return {
    ...edition,
    stories: edition.stories.map((story) => ({
      ...story,
      paragraphs: story.paragraphs.filter((paragraph) => paragraph.id !== paragraphId),
    })),
  };
}

// Moves a paragraph into `toStoryId` before `beforeParagraphId` (last when null).
// Works within one story and across stories; unknown targets leave the edition unchanged.
export function moveParagraph(
  edition: Edition,
  paragraphId: string,
  toStoryId: string,
  beforeParagraphId: string | null,
): Edition {
  const source = edition.stories.find((story) => story.paragraphs.some((paragraph) => paragraph.id === paragraphId));
  const target = edition.stories.find((story) => story.id === toStoryId);
  const moving = source?.paragraphs.find((paragraph) => paragraph.id === paragraphId);
  if (!source || !target || !moving || beforeParagraphId === paragraphId) return edition;

  const sourceRest = source.paragraphs.filter((paragraph) => paragraph.id !== paragraphId);
  const targetBase = target.id === source.id ? sourceRest : target.paragraphs;
  const at = beforeParagraphId === null
    ? targetBase.length
    : targetBase.findIndex((paragraph) => paragraph.id === beforeParagraphId);
  if (at === -1) return edition;
  const targetParagraphs = [...targetBase.slice(0, at), moving, ...targetBase.slice(at)];

  return {
    ...edition,
    stories: edition.stories.map((story) => {
      if (story.id === target.id) return { ...story, paragraphs: targetParagraphs };
      if (story.id === source.id) return { ...story, paragraphs: sourceRest };
      return story;
    }),
  };
}

export function updateLayout(edition: Edition, changes: Partial<Layout>): Edition {
  return { ...edition, layout: normalizeLayout({ ...edition.layout, ...changes }) };
}

export function updateText(edition: Edition, changes: Partial<EditionText>): Edition {
  return { ...edition, text: { ...edition.text, ...changes } };
}
