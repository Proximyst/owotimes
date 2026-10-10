import { isRecord } from "./guards.ts";
import { isCrumpleMethod, type CrumpleMethod } from "./paper.ts";

export const PAPER_PRESETS = {
  A3: { widthMm: 297, heightMm: 420 },
  A4: { widthMm: 210, heightMm: 297 },
  Letter: { widthMm: 216, heightMm: 279 },
  Tabloid: { widthMm: 279, heightMm: 432 },
} as const;

export type PaperSize = keyof typeof PAPER_PRESETS | "Custom";

export const PAPER_SIZE_LABELS: Record<PaperSize, string> = {
  A3: "A3",
  A4: "A4",
  Letter: "US Letter",
  Tabloid: "Tabloid",
  Custom: "Custom (sliders)",
};

export const CUSTOM_WIDTH_RANGE = { min: 100, max: 600 } as const;
export const CUSTOM_HEIGHT_RANGE = { min: 100, max: 900 } as const;
export const COLUMN_RANGE = { min: 1, max: 4 } as const;
export const BODY_SIZE_RANGE = { min: 8, max: 16 } as const;
export const CRUMPLE_RANGE = { min: 0, max: 100 } as const;

// Suggestions for the font inputs. Bundled faces render everywhere; the rest
// depend on the reader's installed fonts.
export const FONT_PRESETS = [
  "Playfair Display",
  "UnifrakturMaguntia",
  "Georgia",
  "Times New Roman",
  "Palatino Linotype",
  "Garamond",
  "Gill Sans",
  "Helvetica",
  "Courier New",
] as const;

export const FONT_NAME_MAX_LENGTH = 60;

export interface Layout {
  paperSize: PaperSize;
  customWidthMm: number;
  customHeightMm: number;
  columns: number;
  mastheadFont: string;
  headlineFont: string;
  bodyFont: string;
  bodySize: number;
  crumple: number;
  crumpleMethod: CrumpleMethod;
}

export const DEFAULT_LAYOUT: Layout = {
  paperSize: "A4",
  customWidthMm: 210,
  customHeightMm: 297,
  columns: 2,
  mastheadFont: "UnifrakturMaguntia",
  headlineFont: "Playfair Display",
  bodyFont: "Playfair Display",
  bodySize: 11,
  crumple: 6,
  crumpleMethod: "creases",
};

export interface PaperDimensions {
  widthMm: number;
  heightMm: number;
}

export function paperDimensions(layout: Layout): PaperDimensions {
  if (layout.paperSize === "Custom") {
    return { widthMm: layout.customWidthMm, heightMm: layout.customHeightMm };
  }
  return PAPER_PRESETS[layout.paperSize];
}

function isPaperSize(value: unknown): value is PaperSize {
  return typeof value === "string" && Object.hasOwn(PAPER_SIZE_LABELS, value);
}

function clampInteger(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, Math.round(value)))
    : fallback;
}

// Font names are kept as typed (so spaces survive while editing) and only
// cleaned where they become CSS, in fontStack.
function normalizeFontName(value: unknown, fallback: string): string {
  return typeof value === "string" ? value.slice(0, FONT_NAME_MAX_LENGTH) : fallback;
}

export function normalizeLayout(input: unknown): Layout {
  const record = isRecord(input) ? input : {};
  return {
    paperSize: isPaperSize(record.paperSize) ? record.paperSize : DEFAULT_LAYOUT.paperSize,
    customWidthMm: clampInteger(record.customWidthMm, CUSTOM_WIDTH_RANGE.min, CUSTOM_WIDTH_RANGE.max, DEFAULT_LAYOUT.customWidthMm),
    customHeightMm: clampInteger(record.customHeightMm, CUSTOM_HEIGHT_RANGE.min, CUSTOM_HEIGHT_RANGE.max, DEFAULT_LAYOUT.customHeightMm),
    columns: clampInteger(record.columns, COLUMN_RANGE.min, COLUMN_RANGE.max, DEFAULT_LAYOUT.columns),
    mastheadFont: normalizeFontName(record.mastheadFont, DEFAULT_LAYOUT.mastheadFont),
    headlineFont: normalizeFontName(record.headlineFont, DEFAULT_LAYOUT.headlineFont),
    bodyFont: normalizeFontName(record.bodyFont, DEFAULT_LAYOUT.bodyFont),
    bodySize: clampInteger(record.bodySize, BODY_SIZE_RANGE.min, BODY_SIZE_RANGE.max, DEFAULT_LAYOUT.bodySize),
    crumple: clampInteger(record.crumple, CRUMPLE_RANGE.min, CRUMPLE_RANGE.max, DEFAULT_LAYOUT.crumple),
    crumpleMethod: isCrumpleMethod(record.crumpleMethod) ? record.crumpleMethod : DEFAULT_LAYOUT.crumpleMethod,
  };
}

const FONT_FALLBACK = 'Georgia, "Times New Roman", serif';

// Turns a user-typed family name into a CSS font-family list. Quotes, backslashes,
// and CSS punctuation are removed so a name cannot break out of the declaration.
export function fontStack(family: string): string {
  const safe = family.replace(/["'\\;{}<>]/g, "").trim();
  return safe ? `"${safe}", ${FONT_FALLBACK}` : FONT_FALLBACK;
}

export function pageSizeCss(dimensions: PaperDimensions): string {
  return `@page { size: ${dimensions.widthMm}mm ${dimensions.heightMm}mm; margin: 12mm; }`;
}
