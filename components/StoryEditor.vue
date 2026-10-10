<script setup lang="ts">
import { ref } from "vue";
import type { Story, StoryChanges } from "../src/edition.ts";
import { useDragState } from "../composables/useDragState.ts";

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
    <input
      :id="`headline-${story.id}`"
      type="text"
      :value="story.headline"
      @input="emit('update', { headline: ($event.target as HTMLInputElement).value })"
    >

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
  </fieldset>
</template>
