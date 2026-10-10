<script setup lang="ts">
import { ref } from "vue";
import type { Story } from "../src/edition.ts";
import { useDragState } from "../composables/useDragState.ts";
import { randomCaption } from "../src/captions.ts";

const props = defineProps<{
  story: Story;
  index: number;
  photoUrl?: string;
}>();

const emit = defineEmits<{
  update: [changes: Partial<Pick<Story, "headline" | "span" | "caption" | "kicker">>];
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

function onFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) emit("photo", file);
  input.value = "";
}

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

function shuffleCaption() {
  emit("update", { caption: randomCaption(props.story.caption) });
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

    <label :for="`kicker-${story.id}`">Label above headline</label>
    <input
      :id="`kicker-${story.id}`"
      type="text"
      :value="story.kicker"
      @input="emit('update', { kicker: ($event.target as HTMLInputElement).value })"
    >

    <label :for="`headline-${story.id}`">Headline</label>
    <input
      :id="`headline-${story.id}`"
      type="text"
      :value="story.headline"
      @input="emit('update', { headline: ($event.target as HTMLInputElement).value })"
    >

    <label :for="`span-${story.id}`">Width</label>
    <select
      :id="`span-${story.id}`"
      :value="story.span"
      @change="emit('update', { span: ($event.target as HTMLSelectElement).value as Story['span'] })"
    >
      <option value="column">Single column</option>
      <option value="full">Full width</option>
    </select>

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
        <button type="button" class="button-danger" @click="emit('removeParagraph', paragraph.id)">Remove</button>
      </div>
    </div>
    <div class="button-row">
      <button type="button" @click="emit('addParagraph')">Add paragraph</button>
    </div>

    <label :for="`photo-${story.id}`">Photo</label>
    <input :id="`photo-${story.id}`" type="file" accept="image/*" @change="onFile">
    <label :for="`caption-${story.id}`">Photo caption</label>
    <div class="caption-row">
      <input
        :id="`caption-${story.id}`"
        type="text"
        :value="story.caption"
        @input="emit('update', { caption: ($event.target as HTMLInputElement).value })"
      >
      <button
        type="button"
        class="dice-button"
        title="Random caption"
        :aria-label="`Random caption for story ${index + 1}`"
        @click="shuffleCaption"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="16" cy="16" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      </button>
    </div>

    <p class="field-hint">Paragraphs support **bold** and *italic*.</p>
    <div class="button-row">
      <button v-if="photoUrl" type="button" @click="emit('clearPhoto')">Remove photo</button>
      <button type="button" class="button-danger" @click="emit('remove')">Remove story</button>
    </div>
  </fieldset>
</template>
