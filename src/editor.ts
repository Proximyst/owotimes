import {
  addParagraph,
  addStory,
  moveParagraph,
  moveStory,
  normalizeEdition,
  removeParagraph,
  removeStory,
  updateLayout,
  updateParagraph,
  updateStory,
  updateText,
  type Edition,
  type EditionText,
  type Story,
} from "./edition.ts";
import type { Layout } from "./layout.ts";

export interface EditorCallbacks {
  save?: (edition: Edition) => void;
  render?: (edition: Edition) => void;
}

export interface EditorController {
  readonly edition: Edition;
  updatePublication(changes: Partial<Pick<Edition, "name" | "paperColor" | "date">>): void;
  updateText(changes: Partial<EditionText>): void;
  updateLayout(changes: Partial<Layout>): void;
  updateStory(id: string, changes: Partial<Pick<Story, "headline" | "imageKey" | "span" | "caption" | "kicker">>): void;
  addStory(): Story;
  removeStory(id: string): void;
  moveStory(id: string, beforeStoryId: string | null): void;
  addParagraph(storyId: string): void;
  updateParagraph(id: string, text: string): void;
  removeParagraph(id: string): void;
  moveParagraph(id: string, toStoryId: string, beforeParagraphId: string | null): void;
}

export function createEditorController(initial: unknown, callbacks: EditorCallbacks = {}): EditorController {
  let edition = normalizeEdition(initial);
  const commit = (next: Edition) => {
    edition = next;
    callbacks.save?.(edition);
    callbacks.render?.(edition);
  };

  return {
    get edition(): Edition { return edition; },
    updatePublication(changes) {
      commit({ ...edition, ...changes });
    },
    updateText(changes) {
      commit(updateText(edition, changes));
    },
    updateLayout(changes) {
      commit(updateLayout(edition, changes));
    },
    updateStory(id, changes) {
      commit(updateStory(edition, id, changes));
    },
    addStory(): Story {
      const result = addStory(edition);
      commit(result.edition);
      return result.story;
    },
    removeStory(id) {
      commit(removeStory(edition, id));
    },
    moveStory(id, beforeStoryId) {
      commit(moveStory(edition, id, beforeStoryId));
    },
    addParagraph(storyId) {
      commit(addParagraph(edition, storyId));
    },
    updateParagraph(id, text) {
      commit(updateParagraph(edition, id, text));
    },
    removeParagraph(id) {
      commit(removeParagraph(edition, id));
    },
    moveParagraph(id, toStoryId, beforeParagraphId) {
      commit(moveParagraph(edition, id, toStoryId, beforeParagraphId));
    },
  };
}
