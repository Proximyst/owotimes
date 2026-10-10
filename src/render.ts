import type { Edition, EditionText } from "./edition.ts";
import { fontStack, paperDimensions, type Layout } from "./layout.ts";
import { crumpleBackground } from "./paper.ts";

export interface StoryView {
  id: string;
  isLead: boolean;
  isFull: boolean;
  headline: string;
  paragraphs: string[];
  imageUrl: string | null;
  caption: string;
  kicker: string;
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

export interface NewspaperView {
  name: string;
  date: string;
  paperColor: string;
  text: EditionText;
  layout: LayoutView;
  stories: StoryView[];
}

export const UNTITLED_HEADLINE = "Untitled story";
export const EMPTY_BODY = "Add your story text in the editor.";

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
  return {
    name: edition.name,
    date: edition.date,
    paperColor: edition.paperColor,
    text: edition.text,
    layout: buildLayoutView(edition.layout),
    stories: edition.stories.map((story, index) => {
      const paragraphs = story.paragraphs.map((paragraph) => paragraph.text).filter((text) => text.trim() !== "");
      return {
        id: story.id,
        isLead: index === 0,
        isFull: story.span === "full",
        headline: story.headline || UNTITLED_HEADLINE,
        paragraphs: paragraphs.length ? paragraphs : [EMPTY_BODY],
        imageUrl: story.imageKey ? imageUrls.get(story.imageKey) ?? null : null,
        caption: story.caption,
        kicker: story.kicker,
      };
    }),
  };
}
