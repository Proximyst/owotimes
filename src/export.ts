// Browsers refuse canvases past these sizes. Safari's pixel cap is the tightest.
export const MAX_CANVAS_SIDE = 16384;
export const MAX_CANVAS_PIXELS = 16_000_000;
// Exports render at 2x the CSS size, and drop lower only to fit the canvas limits.
export const MAX_PIXEL_RATIO = 2;
// Space between sheets in the long PNG, in CSS pixels.
export const STRIP_GAP = 24;

// The largest pixel ratio, at most MAX_PIXEL_RATIO, at which a canvas of this CSS size stays
// within the browser limits.
export function exportPixelRatio(width: number, height: number): number {
  const bySide = MAX_CANVAS_SIDE / Math.max(width, height);
  const byArea = Math.sqrt(MAX_CANVAS_PIXELS / (width * height));
  return Math.min(MAX_PIXEL_RATIO, bySide, byArea);
}

// A download name such as "owo-times-page-1.png" for the publication name and a part label.
export function exportFileName(name: string, part: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "newspaper"}-${part}.png`;
}
