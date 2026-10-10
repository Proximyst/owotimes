<script setup lang="ts">
import { computed, ref } from "vue";
import { useEdition } from "../composables/useEdition.ts";
import { useDragState } from "../composables/useDragState.ts";
import { DEFAULT_EDITOR_WIDTH, useEditorWidth } from "../composables/useEditorWidth.ts";
import { paperDimensions, pageSizeCss } from "../src/layout.ts";
import { buildNewspaperView } from "../src/render.ts";
import { editionContext } from "../src/edition.ts";
import { useSheetExport } from "../composables/useSheetExport.ts";

const {
  edition,
  photoUrls,
  saveFailed,
  photoError,
  updatePublication,
  updateText,
  updateLayout,
  resetEdition,
  updateStory,
  addStory,
  removeStory,
  moveStory,
  setPhoto,
  clearPhoto,
} = useEdition();

const drag = useDragState();
const { width: editorWidth, startDrag, moveDrag, endDrag, nudge } = useEditorWidth();
const configuring = ref(false);

const view = computed(() => edition.value ? buildNewspaperView(edition.value, photoUrls) : null);

const preview = ref<{ sheetElements: () => HTMLElement[] } | null>(null);
const { busy: exporting, error: exportError, exportPages, exportStrip } = useSheetExport(
  () => view.value?.name ?? "",
  () => preview.value?.sheetElements() ?? [],
);

// The @page size must match the paper size, so it is generated from the layout.
useHead(() => ({
  style: [{ key: "page-size", textContent: edition.value ? pageSizeCss(paperDimensions(edition.value.layout)) : "" }],
}));

function printEdition() {
  window.print();
}

function onDrop(storyId: string) {
  const item = drag.active.value;
  drag.end();
  if (item?.kind === "story") moveStory(item.id, storyId);
}
</script>

<template>
  <main v-if="!edition" class="loading-state" aria-label="Loading newspaper editor">
    <span class="loading-mark">OT</span>
    <p>Setting the type...</p>
  </main>

  <main v-else class="app-shell" aria-label="Newspaper editor" :style="{ '--editor-default': `${DEFAULT_EDITOR_WIDTH}px`, '--editor-width': `${editorWidth}px` }">
    <aside class="editor-panel no-print" aria-label="Edition settings and stories">
      <ConfigurePanel
        v-if="configuring"
        :edition="edition"
        @publication="updatePublication"
        @text="updateText"
        @layout="updateLayout"
        @reset="resetEdition"
      />

      <h2>Stories</h2>
      <StoryEditor
        v-for="(story, index) in edition.stories"
        :key="story.id"
        :story="story"
        :context="editionContext(edition)"
        :index="index"
        :photo-url="story.imageKey ? photoUrls.get(story.imageKey) : undefined"
        @update="updateStory(story.id, $event)"
        @remove="removeStory(story.id)"
        @photo="setPhoto(story.id, $event)"
        @clear-photo="clearPhoto(story.id)"
        @drop="onDrop"
      />

      <div class="button-row">
        <button type="button" @click="addStory">Add story</button>
      </div>
      <p v-if="saveFailed" class="status-message" role="status">
        Changes could not be saved in this browser and will be lost on reload.
      </p>
      <p v-if="photoError" class="status-message" role="alert">{{ photoError }}</p>
    </aside>
    <div
      class="editor-resizer no-print"
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize stories panel"
      :aria-valuenow="editorWidth"
      tabindex="0"
      @pointerdown="startDrag"
      @pointermove="moveDrag"
      @pointerup="endDrag"
      @pointercancel="endDrag"
      @keydown.left.prevent="nudge(-24)"
      @keydown.right.prevent="nudge(24)"
    ></div>

    <section class="preview" aria-label="Newspaper preview">
      <div class="button-row preview-toolbar no-print">
        <button type="button" :aria-expanded="configuring" @click="configuring = !configuring">
          {{ configuring ? "Close configure" : "Configure" }}
        </button>
        <button type="button" @click="printEdition">Print</button>
        <button type="button" :disabled="exporting" @click="exportPages()">PNG per page</button>
        <button type="button" :disabled="exporting" @click="exportStrip()">Long PNG</button>
      </div>
      <p v-if="exportError" class="status-message no-print" role="alert">{{ exportError }}</p>
      <NewspaperPreview v-if="view" ref="preview" :view="view" />
    </section>
  </main>
</template>
