import { storyParagraphs, type Edition, type EditionText } from "./edition.ts";
import { fontStack, paperDimensions, type Layout } from "./layout.ts";
import { crumpleBackground } from "./paper.ts";

export interface StoryView {
  id: string;
  isLead: boolean;
  isFull: boolean;
  headline: string;
  // Full paragraphs of the story, in order.
  paragraphs: string[];
  imageUrl: string | null;
  caption: string;
  kicker: string;
  byline: string;
}

// The part of a paragraph that sits on one page. A paragraph is cut into pieces where a page
// breaks inside it.
export interface ParagraphPiece {
  // Index of the paragraph within the story.
  index: number;
  // Index of the piece's first word within the paragraph. Above 0 means the piece continues
  // a paragraph from an earlier page.
  word: number;
  text: string;
}

// A story's part on one page. A part that continues a story from an earlier page is `continued`,
// so its header is not shown again.
export interface StoryPart {
  id: string;
  // Unit key of the part's first piece.
  key: string;
  isLead: boolean;
  isFull: boolean;
  continued: boolean;
  headline: string;
  paragraphs: ParagraphPiece[];
  imageUrl: string | null;
  caption: string;
  kicker: string;
  byline: string;
}

export interface LayoutView {
  paperWidth: string;
  paperHeight: string;
  columns: number;
  mastheadFont: string;
  headlineFont: string;
  bodyFont: string;
  bodySize: string;
  crumpleImage: string;
}

export interface PageView {
  number: number;
  stories: StoryPart[];
}

export interface NewspaperView {
  name: string;
  date: string;
  paperColor: string;
  text: EditionText;
  layout: LayoutView;
  // Every story in reading order, with all of its paragraphs.
  stories: StoryView[];
  // Unit keys where a page starts because a story asked for one.
  pageStarts: string[];
  pages: PageView[];
}

export const UNTITLED_HEADLINE = "Untitled story";
export const EMPTY_BODY = "Add your story text in the editor.";

// A break is identified by the story, the paragraph, and the word where a page starts. Word 0 is
// the paragraph's first word, so a break before a whole paragraph is `unitKey(id, index)`.
export function unitKey(storyId: string, paragraphIndex: number, word = 0): string {
  return `${storyId}:${paragraphIndex}:${word}`;
}

// Offset of each word in a paragraph. A word is a run of non-space characters.
function wordStarts(text: string): number[] {
  return [...text.matchAll(/\S+/g)].map((match) => match.index ?? 0);
}

// True when every bold and italic marker in the text is paired, so the text can stand alone.
function markupClosed(text: string): boolean {
  const bold = text.split("**").length - 1;
  const italic = text.replaceAll("**", "").split("*").length - 1;
  return bold % 2 === 0 && italic % 2 === 0;
}

// The largest word index, up to `word`, where a page can start inside a paragraph without cutting
// bold or italic markup. Returns 0 when there is none.
export function splittableWord(text: string, word: number): number {
  const starts = wordStarts(text);
  for (let candidate = Math.min(word, starts.length - 1); candidate > 0; candidate--) {
    const start = starts[candidate] ?? 0;
    if (markupClosed(text.slice(0, start).trimEnd())) return candidate;
  }
  return 0;
}

// The story's paragraphs cut into pieces wherever `breaks` falls inside a paragraph.
function storyPieces(story: StoryView, breaks: ReadonlySet<string>): ParagraphPiece[] {
  return story.paragraphs.flatMap((text, index) => {
    const starts = wordStarts(text);
    const cuts = [0, ...starts.flatMap((_, word) =>
      word > 0 && breaks.has(unitKey(story.id, index, word)) ? [word] : [])];
    return cuts.map((word, n) => {
      const next = cuts[n + 1];
      const from = starts[word] ?? 0;
      const to = next === undefined ? text.length : (starts[next] ?? text.length);
      return { index, word, text: text.slice(from, to).trimEnd() };
    });
  });
}

// A page starts before the first piece and before every piece whose unit key is in `breaks`.
// A story that continues onto a later page keeps only its remaining pieces.
export function paginate(stories: StoryView[], breaks: ReadonlySet<string>): PageView[] {
  const pages: PageView[] = [];
  let page: PageView | null = null;
  for (const story of stories) {
    let part: StoryPart | null = null;
    for (const piece of storyPieces(story, breaks)) {
      const key = unitKey(story.id, piece.index, piece.word);
      if (!page || breaks.has(key)) {
        page = { number: pages.length + 1, stories: [] };
        pages.push(page);
        part = null;
      }
      if (!part) {
        const opening = piece.index === 0 && piece.word === 0;
        part = {
          id: story.id,
          key,
          isLead: story.isLead && opening,
          isFull: story.isFull,
          continued: !opening,
          headline: story.headline,
          paragraphs: [],
          imageUrl: story.imageUrl,
          caption: story.caption,
          kicker: story.kicker,
          byline: story.byline,
        };
        page.stories.push(part);
      }
      part.paragraphs.push(piece);
    }
  }
  return pages;
}

function buildLayoutView(layout: Layout): LayoutView {
  const paper = paperDimensions(layout);
  return {
    paperWidth: `${paper.widthMm}mm`,
    paperHeight: `${paper.heightMm}mm`,
    columns: layout.columns,
    mastheadFont: fontStack(layout.mastheadFont),
    headlineFont: fontStack(layout.headlineFont),
    bodyFont: fontStack(layout.bodyFont),
    bodySize: `${layout.bodySize}pt`,
    crumpleImage: crumpleBackground(layout.crumple, layout.crumpleMethod),
  };
}

export function buildNewspaperView(edition: Edition, imageUrls: ReadonlyMap<string, string> = new Map()): NewspaperView {
  const stories = edition.stories.map((story, index): StoryView => {
    const paragraphs = storyParagraphs(story.body);
    return {
      id: story.id,
      isLead: index === 0,
      isFull: story.span === "full",
      headline: story.headline || UNTITLED_HEADLINE,
      paragraphs: paragraphs.length ? paragraphs : [EMPTY_BODY],
      imageUrl: story.imageKey ? imageUrls.get(story.imageKey) ?? null : null,
      caption: story.caption,
      kicker: story.kicker,
      byline: story.byline,
    };
  });

  // A story that asks for a new page starts one at its first paragraph.
  const pageStarts = edition.stories.flatMap((story) =>
    story.startsPage ? [unitKey(story.id, 0)] : []);

  return {
    name: edition.name,
    date: edition.date,
    paperColor: edition.paperColor,
    text: edition.text,
    layout: buildLayoutView(edition.layout),
    stories,
    pageStarts,
    pages: paginate(stories, new Set(pageStarts)),
  };
}
