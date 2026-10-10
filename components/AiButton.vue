<script setup lang="ts">
import { computed, ref } from "vue";
import type { AiReport, AiStatus } from "../src/ai.ts";

const props = defineProps<{
  label: string;
  // Produces the replacement text. The caller decides what context is sent and passes the
  // report callback on to the request, so its progress shows here.
  task: (report: AiReport) => Promise<string>;
}>();

const emit = defineEmits<{ result: [text: string] }>();
const busy = ref(false);
const status = ref<AiStatus | null>(null);
const error = ref<string | null>(null);

function statusText(current: AiStatus): string {
  switch (current.phase) {
    case "waiting":
      return "Waiting for the model…";
    case "retrying":
      return `Retry ${current.attempt} of ${current.attempts}: ${current.reason}`;
    case "writing":
      return `Writing… ${current.tokens} tokens`;
  }
}

// Progress while a request runs, then its failure until the next request.
const message = computed(() => {
  if (busy.value) return status.value ? statusText(status.value) : "Starting…";
  return error.value ?? "";
});

async function run() {
  busy.value = true;
  error.value = null;
  status.value = null;
  try {
    emit("result", await props.task((next) => {
      status.value = next;
    }));
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "The AI request failed.";
  } finally {
    busy.value = false;
    status.value = null;
  }
}
</script>

<template>
  <span class="ai-control">
    <button
      type="button"
      class="dice-button ai-button"
      :title="label"
      :aria-label="label"
      :aria-busy="busy"
      :disabled="busy"
      @click="run"
    >
      <span aria-hidden="true">{{ busy ? "…" : "AI" }}</span>
    </button>
    <span v-if="message" class="ai-status" :class="{ 'is-error': !busy && error }" role="status">{{ message }}</span>
  </span>
</template>
