# OwO Times

A browser-only newspaper editor. Write stories, choose a layout, and see a live
newspaper preview. Everything is stored in the browser: settings and text in
localStorage, photos in IndexedDB. No data leaves the browser.

## Editing

- **Stories:** each story has a headline, a width (single column or full width),
  any number of paragraphs (with **bold** and *italic*), a label above the headline, and an optional photo with its own caption.
- **Drag and drop:** drag the ⋮⋮ handle on a story to reorder stories. Drag the
  handle on a paragraph to move it within a story, or onto another story. Drop on
  a paragraph to insert before it; drop on a story to append.
- **Configure:** the Configure button above the preview opens settings for the
  publication name and date line, paper tone (preset swatches or any colour), masthead,
  tagline, banner, footer, byline, paper size, column count, body text size,
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
the editor and render the newspaper on a white background. Use the browser's
"Save as PDF" destination to keep a PDF copy.
