# OwO Times

A browser-only newspaper editor. Write stories, choose a layout, and see a live
newspaper preview. Everything is stored in the browser: settings and text in
localStorage, photos in IndexedDB. No data leaves the browser.

## Editing

- **Stories:** each story has a headline, a width (single column or full width),
  and story text in one box; blank lines start a new paragraph (with **bold** and *italic*).
- **Story settings:** the Story settings button opens a wide dialog with the label
  above the headline, the byline, the photo caption, the width, and the photo.
  Dice buttons next to the top left, top right, and tagline fields in Configure, and
  next to the label, byline, and caption in Story settings, pick a different text from a pool.
- **Pages:** a story can start a new page from Story settings. Each page is one sheet
  of the chosen paper size. The masthead is on page 1 and later pages get a running
  head with the page number. Text that does not fit flows onto a new page automatically, even
  in the middle of a paragraph, but never inside bold or italic text. Only text that cannot be
  placed that way, such as a bold or italic span longer than a page, is cut off and flagged.
- **AI text (bring your own key):** Configure has an AI text section with the API
  endpoint, model, key, temperature, and extra instructions, with buttons that fill in OpenAI, OpenRouter, or Anthropic presets. Once AI is switched on and a model and key are set, an AI button appears next to each text field in Configure, beside each story's headline, label, byline, and caption, and beside the story text. Each request sends all of the newspaper's text as context. The settings
  are stored only in this browser, and the page calls the endpoint directly, so the endpoint
  must allow browser (CORS) requests. The key is visible to anyone using this browser.
  The story text also has an AI button that opens a dialog for your prompt and replaces the whole story text with the result.
- **Drag and drop:** drag the ⋮⋮ handle on a story to reorder stories. Drop a story on another story to move it before that one.
- **Stories panel size:** drag the right edge of the stories panel to widen it. It opens over the preview, so you can edit without the newspaper in view. Narrower than the preview column it leaves the preview visible. Focus the edge and press the left or right arrow keys to resize it from the keyboard. On narrow screens the panel stacks above the preview and cannot be resized.
- **Configure:** the Configure button above the preview opens settings for the
  publication name and date line, paper tone (preset swatches or any colour), masthead,
  tagline, banner, footer, paper size, column count, body text size,
  paper crumple (amount and method), and fonts.
  - **Paper size:** A3, A4, US Letter, Tabloid, or Custom. Custom shows width
    (100–600 mm) and height (100–900 mm) sliders.
  - **Fonts:** each of the masthead, headline, and body fonts takes any font name.
    Playfair Display (body and headlines) and UnifrakturMaguntia (masthead) are
    bundled with the site and render everywhere. Other names use the reader's
    installed fonts and fall back to a serif if missing.
- **Reset:** the Reset newspaper button at the bottom of Configure restores the default newspaper. All stories, photos, text, and layout are removed; AI settings are kept.

Keyboard users can edit everything, but stories can only be reordered by dragging.

## Development

Bun is used for install, development, tests, and the build.

```sh
bun install
bun run dev       # dev server on 0.0.0.0
bun test          # unit and contract tests
bun run build     # static generation into .output/public
```

Bundled fonts come from the `@fontsource/playfair-display` and
`@fontsource/unifrakturmaguntia` packages, so the build makes no third-party font
requests.

## Deployment

The deployable output is static files only. Bun and Node are not needed at runtime.

1. Run `bun run build`.
2. Copy the contents of `.output/public` into nginx's document root
   (`/usr/share/nginx/html`, as configured in `nginx.conf`).
3. Serve the site with nginx using `nginx.conf`, which falls back to `index.html`
   for unknown paths.

## Printing

Use the Print button above the preview, or the browser's print command. The page
size is set from the chosen paper size, including custom sizes. Print styles hide
the editor and print each page as one sheet in its paper colour. Use the browser's
"Save as PDF" destination to keep a PDF copy. Browsers normally leave out their title,
address, and page-number header and footer because the page margin is zero; if yours
still shows them, turn off "Headers and footers" in the print dialog.

## Exporting PNG

PNG per page saves each sheet as its own file. Long PNG saves all sheets stacked top to bottom in one file, with a gap between sheets. Each image is rendered at 2x the paper size. A long strip is rendered at a lower resolution when needed to stay within browser canvas limits (16,384 pixels per side and 16 million pixels in total), so very long editions export at reduced resolution. Browsers may ask permission before downloading several files at once.
