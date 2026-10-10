import { computed, reactive } from "vue";
import { DEFAULT_AI_SETTINGS, isAiReady, normalizeAiSettings, type AiSettings } from "../src/ai.ts";
import { createAiSettingsStorage } from "../src/storage.ts";

const settings = reactive<AiSettings>({ ...DEFAULT_AI_SETTINGS });
let loaded = false;

// Settings are read once per page load and persisted to this browser only.
// Values are stored as typed; trimming happens where they are used, so spaces survive typing.
export function useAiSettings() {
  if (!loaded) {
    Object.assign(settings, normalizeAiSettings(createAiSettingsStorage().load()));
    loaded = true;
  }
  const ready = computed(() => isAiReady(settings));

  function update(changes: Partial<AiSettings>) {
    Object.assign(settings, changes);
    createAiSettingsStorage().save({ ...settings });
  }

  return { settings, ready, update };
}
