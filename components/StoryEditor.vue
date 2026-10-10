<script setup lang="ts">
import { ref } from "vue";
import type { Story, StoryChanges } from "../src/edition.ts";
import { useDragState } from "../composables/useDragState.ts";
import { generateText, type AiReport } from "../src/ai.ts";
import { useAiSettings } from "../composables/useAiSettings.ts";

const props = defineProps<{
  story: Story;
  index: number;
  photoUrl?: string;
  context: string;
}>();

const emit = defineEmits<{
  update: [changes: StoryChanges];
  remove: [];
  photo: [file: File];
  clearPhoto: [];
  drop: [storyId: string];
}>();

const drag = useDragState();
const settingsOpen = ref(false);
const { ready: aiReady, settings: aiSettings } = useAiSettings();
const aiBodyOpen = ref(false);
const aiPrompt = ref("");

function allowDrop(event: DragEvent) {
  if (drag.active.value) event.preventDefault();
}

// Dropping a story on this one moves the dragged story before it.
function dropOn() {
  emit("drop", props.story.id);
}

// The modal's prompt is the reader's own request; the result replaces the whole story text.
function bodyTask() {
  return (report: AiReport) => generateText(aiSettings, { field: "Story text", current: props.story.body, context: props.context, prompt: aiPrompt.value }, report);
}

function writeBody(text: string) {
  emit("update", { body: text });
  aiBodyOpen.value = false;
}

function headlineTask() {
  return (report: AiReport) => generateText(aiSettings, { field: "Headline", current: props.story.headline, context: props.context }, report);
}
</script>

<template>
  <fieldset
    class="story-editor"
    :class="{ 'story-full': story.span === 'full' }"
    @dragover="allowDrop"
    @drop.prevent="dropOn"
  >
    <legend class="story-legend">
      <span
        class="drag-handle"
        draggable="true"
        title="Drag to move story"
        aria-hidden="true"
        @dragstart="drag.start({ kind: 'story', id: story.id }, $event.dataTransfer)"
        @dragend="drag.end"
      >⋮⋮</span>
      Story {{ index + 1 }}
    </legend>

    <label :for="`headline-${story.id}`">Headline</label>
    <div class="dice-row">
      <input
        :id="`headline-${story.id}`"
        type="text"
        :value="story.headline"
        @input="emit('update', { headline: ($event.target as HTMLInputElement).value })"
      >
      <AiButton
        v-if="aiReady"
        :label="`AI headline for story ${index + 1}`"
        :task="headlineTask()"
        @result="(text) => emit('update', { headline: text })"
      />
    </div>

    <label :for="`body-${story.id}`">Story text</label>
    <div class="dice-row">
      <textarea
        :id="`body-${story.id}`"
        rows="8"
        :value="story.body"
        @input="emit('update', { body: ($event.target as HTMLTextAreaElement).value })"
      />
      <button
        v-if="aiReady"
        type="button"
        class="dice-button ai-button"
        title="Write story text with AI"
        aria-label="Write story text with AI"
        @click="aiBodyOpen = true"
      >AI</button>
    </div>

    <p class="field-hint">Blank lines start a new paragraph. Paragraphs support **bold** and *italic*. Each paragraph after the first is indented.</p>
    <div class="button-row">
      <button type="button" @click="settingsOpen = true">Story settings</button>
      <button type="button" class="button-danger" @click="emit('remove')">Remove story</button>
    </div>

    <Modal v-if="settingsOpen" :title="`Story ${index + 1} settings`" @close="settingsOpen = false">
      <StorySettings
        :story="story"
        :context="context"
        :index="index"
        :photo-url="photoUrl"
        @update="emit('update', $event)"
        @photo="emit('photo', $event)"
        @clear-photo="emit('clearPhoto')"
      />
    </Modal>
    <Modal v-if="aiBodyOpen" title="Write story text with AI" @close="aiBodyOpen = false">
      <label for="ai-body-prompt">What should the story say?</label>
      <textarea id="ai-body-prompt" v-model="aiPrompt" rows="4" />
      <p class="field-hint">The result replaces the whole story text.</p>
      <AiButton label="Write story text" :task="bodyTask()" @result="writeBody" />
    </Modal>
  </fieldset>
</template>
