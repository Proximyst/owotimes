import { describe, expect, test } from "bun:test";
import { createEditorController } from "../src/editor.ts";
import { createDefaultEdition } from "../src/edition.ts";

describe("editor controller", () => {
  test("updates the edition and calls persistence and preview callbacks", () => {
    const writes = [];
    const renders = [];
    const controller = createEditorController(createDefaultEdition(), {
      save: (edition) => writes.push(edition),
      render: (edition) => renders.push(edition),
    });

    controller.updatePublication({ name: "The Morning OwO", paperColor: "#ddccaa" });
    controller.updateStory(controller.edition.stories[0].id, { headline: "Extra!" });

    expect(controller.edition.name).toBe("The Morning OwO");
    expect(controller.edition.paperColor).toBe("#ddccaa");
    expect(controller.edition.stories[0].headline).toBe("Extra!");
    expect(writes).toHaveLength(2);
    expect(renders).toHaveLength(2);
  });

  test("adds and removes stories and associates photo keys", () => {
    const controller = createEditorController(createDefaultEdition());
    const story = controller.addStory();
    controller.updateStory(story.id, { imageKey: "photo-1" });

    expect(controller.edition.stories.find((item) => item.id === story.id).imageKey).toBe("photo-1");
    controller.removeStory(story.id);
    expect(controller.edition.stories.some((item) => item.id === story.id)).toBe(false);
  });
});
