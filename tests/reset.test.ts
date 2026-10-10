import { describe, expect, test } from "bun:test";
import { createEditorController } from "../src/editor.ts";
import { createDefaultEdition } from "../src/edition.ts";
import { DEFAULT_LAYOUT } from "../src/layout.ts";

describe("editor reset", () => {
  test("restores default text, layout, and stories after edits", () => {
    const controller = createEditorController(createDefaultEdition());
    const defaults = createDefaultEdition();
    controller.updateLayout({ mastheadFont: "Georgia", headlineFont: "Georgia" });
    controller.updateText({ banner: "CHANGED BANNER" });
    controller.addStory();

    controller.reset();

    expect(controller.edition.layout.mastheadFont).toBe(DEFAULT_LAYOUT.mastheadFont);
    expect(controller.edition.layout.headlineFont).toBe(DEFAULT_LAYOUT.headlineFont);
    expect(controller.edition.text.banner).toBe(defaults.text.banner);
    expect(controller.edition.stories.length).toBe(defaults.stories.length);
  });
});
