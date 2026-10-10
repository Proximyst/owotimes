export interface Segment {
  text: string;
  bold: boolean;
  italic: boolean;
}

interface InlineStyle {
  bold: boolean;
  italic: boolean;
}

// Matches **bold** or *italic*. The delimiters must hug non-space text, so "5 * 3" stays literal.
const EMPHASIS = /\*\*(?=\S)([\s\S]*?\S)\*\*|\*(?=\S)([\s\S]*?\S)\*/g;

// Splits inline markdown into styled text runs. Output is plain data, never HTML.
export function parseInline(source: string, style: InlineStyle = { bold: false, italic: false }): Segment[] {
  const segments: Segment[] = [];
  let last = 0;

  for (const match of source.matchAll(EMPHASIS)) {
    const start = match.index ?? 0;
    if (start > last) segments.push(run(source.slice(last, start), style));

    const isBold = match[1] !== undefined;
    const inner = match[1] ?? match[2] ?? "";
    segments.push(...parseInline(inner, {
      bold: style.bold || isBold,
      italic: style.italic || !isBold,
    }));
    last = start + match[0].length;
  }

  if (last < source.length) segments.push(run(source.slice(last), style));
  return segments;
}

function run(text: string, style: InlineStyle): Segment {
  return { text, bold: style.bold, italic: style.italic };
}
