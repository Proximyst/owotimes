<script setup lang="ts">
import { ref } from "vue";
import type { Story, StoryChanges } from "../src/edition.ts";
import { useDragState } from "../composables/useDragState.ts";
import { generateText } from "../src/ai.ts";
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
  addParagraph: [];
  updateParagraph: [id: string, text: string];
  removeParagraph: [id: string];
  drop: [target: { storyId: string; beforeParagraphId: string | null }];
}>();

const drag = useDragState();
const hoveredParagraphId = ref<string | null>(null);
const settingsOpen = ref(false);
const { ready: aiReady, settings: aiSettings } = useAiSettings();
const aiParagraphId = ref<string | null>(null);
const aiPrompt = ref("");

function allowDrop(event: DragEvent) {
  if (drag.active.value) event.preventDefault();
}

function hoverParagraph(id: string, event: DragEvent) {
  allowDrop(event);
  hoveredParagraphId.value = id;
}

// Dropping on a paragraph inserts before it; dropping on the story itself appends.
function dropOn(beforeParagraphId: string | null) {
  hoveredParagraphId.value = null;
  emit("drop", { storyId: props.story.id, beforeParagraphId });
}

// The paragraph the AI modal is writing for. The prompt is the reader's own request.
function paragraphTask() {
  const current = props.story.paragraphs.find((paragraph) => paragraph.id === aiParagraphId.value)?.text ?? "";
  return () => generateText(aiSettings, { field: "Story paragraph", current, context: props.context, prompt: aiPrompt.value });
}

function writeParagraph(text: string) {
  if (aiParagraphId.value) emit("updateParagraph", aiParagraphId.value, text);
  aiParagraphId.value = null;
}

function headlineTask() {
  return () => generateText(aiSettings, { field: "Headline", current: props.story.headline, context: props.context });
}
</script>

<template>
  <fieldset
    class="story-editor"
    :class="{ 'story-full': story.span === 'full' }"
    @dragover="allowDrop"
    @drop.prevent="dropOn(null)"
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

    <div class="paragraph-list">
      <div
        v-for="(paragraph, n) in story.paragraphs"
        :key="paragraph.id"
        class="paragraph-row"
        :class="{ 'is-drop-target': hoveredParagraphId === paragraph.id }"
        @dragover="hoverParagraph(paragraph.id, $event)"
        @dragleave="hoveredParagraphId = null"
        @drop.prevent.stop="dropOn(paragraph.id)"
      >
        <span
          class="drag-handle"
          draggable="true"
          title="Drag to move paragraph"
          aria-hidden="true"
          @dragstart="drag.start({ kind: 'paragraph', id: paragraph.id }, $event.dataTransfer)"
          @dragend="drag.end"
        >⋮⋮</span>
        <textarea
          :aria-label="`Paragraph ${n + 1}`"
          :value="paragraph.text"
          @input="emit('updateParagraph', paragraph.id, ($event.target as HTMLTextAreaElement).value)"
        />
        <div class="paragraph-actions">
          <button
            v-if="aiReady"
            type="button"
            class="dice-button ai-button"
            :title="`Write paragraph ${n + 1} with AI`"
            :aria-label="`Write paragraph ${n + 1} with AI`"
            @click="aiParagraphId = paragraph.id"
          >AI</button>
          <button type="button" class="button-danger" @click="emit('removeParagraph', paragraph.id)">Remove</button>
        </div>
      </div>
    </div>

    <p class="field-hint">Paragraphs support **bold** and *italic*.</p>
    <div class="button-row">
      <button type="button" @click="emit('addParagraph')">Add paragraph</button>
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
    <Modal v-if="aiParagraphId" title="Write paragraph with AI" @close="aiParagraphId = null">
      <label for="ai-paragraph-prompt">What should this paragraph say?</label>
      <textarea id="ai-paragraph-prompt" v-model="aiPrompt" rows="4" />
      <AiButton label="Write paragraph" :task="paragraphTask()" @result="writeParagraph" />
    </Modal>
  </fieldset>
</template>
