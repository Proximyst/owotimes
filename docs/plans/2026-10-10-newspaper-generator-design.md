# Newspaper Generator Design

## Goal

Create a browser-based newspaper editor that lets a user configure a publication
name, paper tone, headlines, article text, and photos while seeing a live
newspaper preview. The default publication name is "OwO Times" and the visual
style takes cues from traditional British newspapers.

## Runtime and delivery

The delivered app is static HTML, CSS, and JavaScript. Bun may be used during
development and to build/package the static output, but it is not present at
runtime. Nginx serves the resulting files; the browser performs all editing,
preview, persistence, and printing. There is no application server, API, or
remote storage dependency.

## User experience

- A responsive editor provides controls for publication settings and story
  content alongside a live preview.
- The preview resembles a newspaper page, with an adjustable warm paper color,
  subtle crumpled-paper texture, a prominent serif masthead, and column-based
  headlines, body copy, and photographs.
- The user can add, edit, and remove stories, with optional local photos.
- A print action uses browser print styles to produce a clean page suitable for
  printing or saving as PDF.

## Browser-side state

The edition is local to the browser. Text and settings are persisted in browser
storage, while uploaded image data is stored in IndexedDB to avoid localStorage
size limits. The live preview is rendered from this edition state. No user data
is sent to a server.

## Alternatives considered

1. A minimal vanilla-JavaScript static app has the smallest dependency and
   runtime footprint, and fits the nginx-only deployment requirement.
2. A framework-based static app offers more structure but adds dependencies
   without a current need for a larger client application.
3. A server-backed editor can share editions across devices, but conflicts with
   the requirement that nginx alone serve the deployed output.

The first option is selected, with Bun reserved for development/build tooling.

## Scope

The first version supports editing one browser-local edition at a time. Accounts,
cloud synchronization, collaboration, and multi-edition management are out of
scope. Local photo uploads and browser print/PDF are included.

## Validation

Verify the static build can be served without Bun at runtime; exercise editing,
refresh persistence, image upload persistence, responsive preview behavior, and
print layout in a browser; run project checks/build using Bun.
