# Newspaper Generator Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a browser-only newspaper editor that statically generates into files served by nginx.

**Architecture:** Use Nuxt 3 and TypeScript with client-only edition state. Persist settings and story text in localStorage and photo blobs in IndexedDB, then render a live newspaper preview. `nuxt generate` produces the deployable static site; do not add API/server routes or deploy a Nuxt runtime.

**Tech Stack:** Bun, Nuxt 3, Vue 3, TypeScript, Bun test runner, nginx.

---

### Task 1: Establish the Nuxt static project

**Files:**
- Create: `package.json`
- Create: `nuxt.config.ts`
- Create: `app.vue`
- Create: `pages/index.vue`
- Create: `assets/css/main.css`
- Create: `nginx.conf`
- Test: `tests/project.test.ts`

**Step 1: Write a failing project contract test**

Assert that package scripts include dev, generate/build, and test; Nuxt is a dependency; SSR is disabled; and the app has a page and global stylesheet.

**Step 2: Verify the test fails**

Run: `bun test tests/project.test.ts`
Expected: FAIL because the Nuxt project has not been created.

**Step 3: Create the minimal Nuxt static scaffold**

Set `build` to `nuxt generate`, disable SSR, configure global CSS and page metadata, and add an accessible page shell. Configure nginx to serve `/usr/share/nginx/html` with static-file fallback.

**Step 4: Verify project contract and dependency setup**

Run: `bun install && bun test tests/project.test.ts`
Expected: PASS and dependencies install successfully.

### Task 2: Define typed edition state and persistence

**Files:**
- Create: `src/edition.ts`
- Create: `src/storage.ts`
- Test: `tests/edition.test.ts`

**Step 1: Write failing edition behavior tests**

Test default `OwO Times` name, warm paper tone, default story, normalization of incomplete/malformed data, immutable story add/update/remove, and localStorage adapter persistence.

**Step 2: Verify tests fail**

Run: `bun test tests/edition.test.ts`
Expected: FAIL because edition modules do not yet exist.

**Step 3: Implement typed edition operations and browser storage**

Define `Edition` and `Story` types and implement default creation, normalization, and immutable story operations. Add injectable localStorage persistence and IndexedDB photo save/load/remove helpers. Keep image blobs out of localStorage.

**Step 4: Verify edition tests**

Run: `bun test tests/edition.test.ts`
Expected: PASS.

### Task 3: Implement the live newspaper preview

**Files:**
- Create: `components/NewspaperPreview.vue`
- Test: `tests/render.test.ts`
- Modify: `assets/css/main.css`

**Step 1: Write failing rendering tests**

Test publication masthead, date, headline, body text, optional photo, and escaping/rendering user content as text rather than unsafe HTML.

**Step 2: Verify tests fail**

Run: `bun test tests/render.test.ts`
Expected: FAIL because the preview component is missing.

**Step 3: Implement semantic preview and newspaper style**

Render the configured publication and stories as semantic Vue markup. Add a warm adjustable paper surface with layered crumple texture, British-inspired serif masthead and display headlines, rules, image captions, and column layout that collapses on narrow screens.

**Step 4: Verify preview tests**

Run: `bun test tests/render.test.ts`
Expected: PASS, including text escaping and photo-optional cases.

### Task 4: Implement reactive editor and photo workflow

**Files:**
- Modify: `pages/index.vue`
- Create: `components/StoryEditor.vue`
- Create: `composables/useEdition.ts`
- Test: `tests/editor.test.ts`

**Step 1: Write failing editor state tests**

Test publication name/paper tone updates, headline/body updates, story add/remove, image-key association, and persistence/render notifications via injected callbacks.

**Step 2: Verify tests fail**

Run: `bun test tests/editor.test.ts`
Expected: FAIL because editor composable does not exist.

**Step 3: Implement typed editor controls and storage wiring**

Create accessible publication controls, color input, editable story fields, add/remove controls, and local image upload. Save photo blobs to IndexedDB, display via object URLs and revoke replaced URLs. Load edition only after client mount, render preview reactively, and fall back to defaults on storage errors.

**Step 4: Verify editor and current test suite**

Run: `bun test`
Expected: all unit tests pass.

### Task 5: Add print, documentation, and static build checks

**Files:**
- Modify: `pages/index.vue`
- Modify: `assets/css/main.css`
- Modify: `nginx.conf`
- Create: `README.md`
- Test: `tests/build.test.ts`

**Step 1: Write failing generation contract test**

Assert generated output includes the page and client assets, nginx serves the generated directory, and print button/editor are excluded by print CSS.

**Step 2: Verify test fails**

Run: `bun test tests/build.test.ts`
Expected: FAIL before generation/print support is complete.

**Step 3: Implement browser print and deployment instructions**

Add a print button invoking `window.print()`. Hide editor controls in print, use ink-safe white background and page margins, and avoid splitting article blocks where possible. Document Bun install/dev/test/generate commands and copying `.output/public` into nginx's document root; Bun and Node are not required in production.

**Step 4: Generate and test the deployable site**

Run: `bun test && bun run build`
Expected: all tests pass and Nuxt generates `.output/public` static files.

**Step 5: Verify browser behavior and nginx-only runtime**

Serve `.output/public` with nginx and verify desktop/mobile editing, reload persistence, image persistence, paper tone, story add/remove, and print preview. Confirm the deployed process set contains only nginx.

### Task 6: Final verification

**Files:**
- Verify: `package.json`, `nuxt.config.ts`, `pages/`, `components/`, `composables/`, `src/`, `tests/`, `nginx.conf`, `README.md`

**Step 1: Run validation from a clean generated output**

Run: `bun test && bun run build`
Expected: tests pass and static generation succeeds.

**Step 2: Inspect deployment output and worktree**

Inspect `.output/public` and run `git status --short`.
Expected: deploy output is static-only; only intended files are modified.
