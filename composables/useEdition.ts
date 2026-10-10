import { onBeforeUnmount, onMounted, reactive, shallowRef, ref } from "vue";
import { createEditorController, type EditorController } from "../src/editor.ts";
import type { Edition, EditionText, Story, StoryChanges } from "../src/edition.ts";
import type { Layout } from "../src/layout.ts";
import { createEditionStorage, photoStorage } from "../src/storage.ts";

// Client-only: the edition is read from localStorage after mount, so the
// statically generated HTML never depends on browser state.
export function useEdition() {
  const editionStorage = createEditionStorage();
  const edition = shallowRef<Edition | null>(null);
  const photoUrls = reactive(new Map<string, string>());
  const saveFailed = ref(false);
  const photoError = ref<string | null>(null);
  let controller: EditorController | null = null;

  function setPhotoUrl(key: string, blob: Blob) {
    const previous = photoUrls.get(key);
    if (previous) URL.revokeObjectURL(previous);
    photoUrls.set(key, URL.createObjectURL(blob));
  }

  function forgetPhoto(key: string) {
    const url = photoUrls.get(key);
    if (url) URL.revokeObjectURL(url);
    photoUrls.delete(key);
  }

  async function discardPhoto(key: string) {
    forgetPhoto(key);
    try {
      await photoStorage.remove(key);
    } catch {
      // The story no longer references the blob; a leftover is harmless.
    }
  }

  async function loadPhoto(key: string) {
    try {
      const blob = await photoStorage.load(key);
      if (blob) setPhotoUrl(key, blob);
    } catch {
      // Unreadable photos render as text-only stories.
    }
  }

  function findStory(id: string): Story | undefined {
    return edition.value?.stories.find((story) => story.id === id);
  }

  onMounted(() => {
    controller = createEditorController(editionStorage.loadEdition(), {
      save: (next) => { saveFailed.value = !editionStorage.saveEdition(next); },
      render: (next) => { edition.value = next; },
    });
    edition.value = controller.edition;
    for (const story of controller.edition.stories) {
      if (story.imageKey) void loadPhoto(story.imageKey);
    }
  });

  onBeforeUnmount(() => {
    for (const url of photoUrls.values()) URL.revokeObjectURL(url);
    photoUrls.clear();
  });

  return {
    edition,
    photoUrls,
    saveFailed,
    photoError,
    updatePublication(changes: Partial<Pick<Edition, "name" | "paperColor" | "date">>) {
      controller?.updatePublication(changes);
    },
    updateText(changes: Partial<EditionText>) {
      controller?.updateText(changes);
    },
    updateLayout(changes: Partial<Layout>) {
      controller?.updateLayout(changes);
    },
    updateStory(id: string, changes: StoryChanges) {
      controller?.updateStory(id, changes);
    },
    addStory() {
      controller?.addStory();
    },
    async removeStory(id: string) {
      const key = findStory(id)?.imageKey;
      controller?.removeStory(id);
      if (key) await discardPhoto(key);
    },
    moveStory(id: string, beforeStoryId: string | null) {
      controller?.moveStory(id, beforeStoryId);
    },
    async setPhoto(id: string, file: Blob) {
      if (!file.type.startsWith("image/")) {
        photoError.value = "Choose an image file.";
        return;
      }
      const key = findStory(id)?.imageKey ?? globalThis.crypto.randomUUID();
      try {
        await photoStorage.save(key, file);
      } catch {
        photoError.value = "That photo could not be saved in this browser.";
        return;
      }
      photoError.value = null;
      setPhotoUrl(key, file);
      controller?.updateStory(id, { imageKey: key });
    },
    async clearPhoto(id: string) {
      const key = findStory(id)?.imageKey;
      if (!key) return;
      controller?.updateStory(id, { imageKey: null });
      await discardPhoto(key);
    },
    async resetEdition() {
      const keys = (edition.value?.stories ?? []).map((story) => story.imageKey);
      controller?.reset();
      for (const key of keys) {
        if (key) await discardPhoto(key);
      }
    },
  };
}
