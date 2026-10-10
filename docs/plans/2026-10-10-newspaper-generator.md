# Newspaper Generator Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a browser-only newspaper editor that produces a configurable, printable newspaper as static files served by nginx.

**Architecture:** Use vanilla JavaScript modules and CSS with Bun as the development/build tool only. Keep one edition in browser storage, putting settings and story text in localStorage and photo blobs in IndexedDB; render the edition into a live semantic newspaper preview. The build output contains only static assets and nginx configuration, with no API or runtime server.

**Tech Stack:** Bun, vanilla JavaScript, HTML, CSS, Bun's built-in test runner, nginx.

---

### Task 1: Establish the static Bun project and test command

**Files:**
- Create: `package.json`
- Create: `src/index.html`
- Create: `src/main.js`
- Create: `src/styles.css`
- Create: `nginx.conf`
- Test: `tests/project.test.js`

**Step 1: Add a failing project contract test**

Create a Bun test that reads the package manifest and source entry points and asserts that a build script exists and that the HTML entry imports the app stylesheet and JavaScript module.

**Step 2: Run the test to verify it fails**

Run: `bun test tests/project.test.js`
Expected: FAIL because the project manifest and source files do not exist yet.

**Step 3: Add the minimal static project skeleton**

Define `build` as a Bun build command that outputs the JavaScript bundle into `dist`, and make the command copy `src/index.html` and `src/styles.css` to `dist`. Define `test` as `bun test`. Add an HTML shell with a stylesheet and module entry. Add an nginx config that serves `/usr/share/nginx/html` and falls back to `index.html` for app routes.

**Step 4: Run the project contract and build**

Run: `bun test tests/project.test.js && bun run build`
Expected: PASS and a `dist` directory containing HTML, CSS, and bundled JavaScript.

### Task 2: Define edition state and persistence

**Files:**
- Create: `src/edition.js`
- Create: `src/storage.js`
- Create: `tests/edition.test.js`
- Modify: `package.json`

**Step 1: Write failing edition behavior tests**

Test the default publication name `OwO Times`, warm default paper tone, an initial editable story, creation/removal of stories, and normalization of incomplete or malformed edition data. Test persistence through an injectable storage adapter so the edition module is independent of browser globals.

**Step 2: Run tests to verify they fail**

Run: `bun test tests/edition.test.js`
Expected: FAIL because edition and storage modules are not implemented.

**Step 3: Implement edition state operations and storage adapters**

Export default edition creation, edition normalization, and story add/update/remove operations from `src/edition.js`. Implement localStorage-backed text/settings persistence and IndexedDB photo-blob persistence in `src/storage.js`; keep the localStorage interface replaceable in tests. Store stable story IDs and image keys, not image data URLs, in the edition record.

**Step 4: Run edition tests**

Run: `bun test tests/edition.test.js`
Expected: PASS for defaults, normalization, story operations, and injected persistence behavior.

### Task 3: Render the newspaper preview

**Files:**
- Create: `src/render.js`
- Create: `tests/render.test.js`
- Modify: `src/styles.css`

**Step 1: Write failing renderer tests**

Test that the renderer produces a masthead with the configured name, date/edition line, story headline and text, optional image markup, and safely escaped user-provided HTML characters.

**Step 2: Run tests to verify they fail**

Run: `bun test tests/render.test.js`
Expected: FAIL because no newspaper renderer exists.

**Step 3: Implement semantic preview markup and newspaper styling**

Render escaped edition content into semantic masthead, article, heading, paragraph, and figure elements. Implement a warm paper background with subtle layered crumple texture, configurable paper tone via a CSS custom property, British-inspired serif display typography, newspaper rules, and multi-column story layout. At narrow widths, collapse columns so the preview remains readable.

**Step 4: Run renderer tests**

Run: `bun test tests/render.test.js`
Expected: PASS including HTML escaping and optional-photo behavior.

### Task 4: Add the responsive editor and photo workflow

**Files:**
- Modify: `src/index.html`
- Modify: `src/main.js`
- Modify: `src/styles.css`
- Create: `src/editor.js`
- Create: `tests/editor.test.js`

**Step 1: Write failing editor behavior tests**

Test that editor actions update publication name, paper tone, story headline/body, add/remove stories, and selected photo association, and that each action triggers persistence and preview rendering through injected callbacks.

**Step 2: Run tests to verify they fail**

Run: `bun test tests/editor.test.js`
Expected: FAIL because the editor event handlers do not exist.

**Step 3: Implement editor controls and browser wiring**

Create an accessible editor panel with publication-name input, paper color input, story form fields, add/remove story controls, and local image file inputs. Store image blobs in IndexedDB and use object URLs only for display; revoke replaced/removed preview URLs. Connect editor events to edition operations, persistence, and preview rendering. Load the persisted edition on startup and recover to defaults if stored data cannot be read.

**Step 4: Run editor and full unit tests**

Run: `bun test`
Expected: PASS for project, edition, render, and editor test files.

### Task 5: Add print output and document static deployment

**Files:**
- Modify: `src/index.html`
- Modify: `src/main.js`
- Modify: `src/styles.css`
- Modify: `nginx.conf`
- Create: `README.md`
- Create: `tests/build.test.js`

**Step 1: Write failing static-build contract tests**

Assert that the build output contains the HTML, CSS, and JavaScript assets; contains no API/server bundle; and nginx config serves the static output directory. Add a print control and assert it is not part of print media output by checking the corresponding print CSS selectors or markup classes.

**Step 2: Run tests to verify they fail**

Run: `bun test tests/build.test.js`
Expected: FAIL until print styling and build assertions are in place.

**Step 3: Implement print layout and usage/deployment instructions**

Add a print button calling `window.print()`. Hide editor and controls in print media, use a white page with clean ink-safe rules, and keep the newspaper masthead and article content together where practical. Document Bun install/test/build commands and copying `dist` to nginx's document root; clarify that Bun is not required in production.

**Step 4: Run all tests and make a production build**

Run: `bun test && bun run build`
Expected: all tests pass and `dist` contains only static deployable assets.

**Step 5: Verify browser behavior and nginx-only runtime**

Serve `dist` with nginx and manually verify at desktop and mobile widths: editing, refresh persistence, photo persistence after refresh, paper tone changes, story add/remove, and print preview. Confirm the production container/process list requires only nginx and no Bun server.

### Task 6: Final verification

**Files:**
- Verify: `package.json`, `src/`, `tests/`, `nginx.conf`, `README.md`

**Step 1: Run the complete validation sequence**

Run: `bun test && bun run build`
Expected: all tests pass and static build succeeds from a clean build output directory.

**Step 2: Inspect the deployment artifact**

Run: `git status --short` and inspect `dist` contents.
Expected: only intended project changes are present and deployment artifact contains no server-side runtime code.
