<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  label: string;
  // Produces the replacement text. The caller decides what context is sent.
  task: () => Promise<string>;
}>();

const emit = defineEmits<{ result: [text: string] }>();
const busy = ref(false);
const error = ref<string | null>(null);

async function run() {
  busy.value = true;
  error.value = null;
  try {
    emit("result", await props.task());
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "The AI request failed.";
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <button
    type="button"
    class="dice-button ai-button"
    :title="error ?? label"
    :aria-label="label"
    :aria-busy="busy"
    :disabled="busy"
    @click="run"
  >
    <span aria-hidden="true">{{ busy ? "…" : "AI" }}</span>
  </button>
</template>
