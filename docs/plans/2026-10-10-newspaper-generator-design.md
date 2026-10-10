# Newspaper Generator Design

## Goal

Create a browser-based newspaper editor that lets a user configure a publication
name, paper tone, headlines, article text, and photos while seeing a live
newspaper preview. The default publication name is "OwO Times" and the visual
style takes cues from traditional British newspapers.

## Runtime and delivery

The app is built with Nuxt and TypeScript and statically generated for deployment.
Bun is used for development, tests, and the build, but is not present at runtime.
Nginx serves Nuxt's generated static output; the browser performs all editing,
preview, persistence, and printing. There are no server routes, runtime Nuxt
server, API, or remote storage dependency.

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

1. A Nuxt static-generated TypeScript app provides typed components and
   conventions while keeping production deployment static and browser-only.
2. A minimal vanilla-JavaScript static app has fewer dependencies, but less
   structure for the editor and reactive preview.
3. A server-backed editor can share editions across devices, but conflicts with
   the requirement that nginx alone serve the deployed output.

The first option is selected, with Bun reserved for development/build tooling.

## Scope

The first version supports editing one browser-local edition at a time. Accounts,
cloud synchronization, collaboration, and multi-edition management are out of
scope. Local photo uploads and browser print/PDF are included.

## Validation

Verify Nuxt static generation can be served without Bun at runtime; exercise editing,
refresh persistence, image upload persistence, responsive preview behavior, and
print layout in a browser; run project checks/build using Bun.
