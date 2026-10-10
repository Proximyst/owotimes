# OwO Times

A browser-only newspaper editor. Write stories, choose a layout, and see a live
newspaper preview. Everything is stored in the browser: settings and text in
localStorage, photos in IndexedDB. No data leaves the browser.

## Editing

- **Stories:** each story has a headline, a width (single column or full width),
  and any number of paragraphs (with **bold** and *italic*).
- **Story settings:** the Story settings button opens a wide dialog with the label
  above the headline, the byline, the photo caption, the width, and the photo.
  Dice buttons next to the top left, top right, and tagline fields in Configure, and
  next to the label, byline, and caption in Story settings, pick a different text from a pool.
- **Pages:** a story can start a new page from Story settings. Each page is one sheet
  of the chosen paper size. The masthead is on page 1 and later pages get a running
  head with the page number. A page that is too long is flagged in the preview, because
  anything past its bottom is cut off.
- **AI text (bring your own key):** Configure has an AI text section with the API
  endpoint, model, key, temperature, and extra instructions. Once AI is switched on and
  a model and key are set, an AI button appears next to each dice button. The settings
  are stored only in this browser, and the page calls the endpoint directly, so the endpoint
  must allow browser (CORS) requests. The key is visible to anyone using this browser.
- **Drag and drop:** drag the ⋮⋮ handle on a story to reorder stories. Drag the
  handle on a paragraph to move it within a story, or onto another story. Drop on
  a paragraph to insert before it; drop on a story to append.
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

Keyboard users can edit everything, but paragraphs and stories can only be
reordered by dragging.

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
