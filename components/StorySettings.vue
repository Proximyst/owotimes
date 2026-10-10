<script setup lang="ts">
import { KICKER_IDEAS, BYLINE_IDEAS, CAPTION_IDEAS, randomFrom } from "../src/pools.ts";
import type { Story, StoryChanges } from "../src/edition.ts";
import { generateText } from "../src/ai.ts";
import { useAiSettings } from "../composables/useAiSettings.ts";

const props = defineProps<{
  story: Story;
  index: number;
  photoUrl?: string;
}>();

const emit = defineEmits<{
  update: [changes: StoryChanges];
  photo: [file: File];
  clearPhoto: [];
}>();

function onFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) emit("photo", file);
  input.value = "";
}

const { ready: aiReady, settings: aiSettings } = useAiSettings();

// Context for AI text: the story's headline and paragraphs.
function storyContext(): string {
  return [props.story.headline, ...props.story.paragraphs.map((paragraph) => paragraph.text)].join("\n\n");
}

function aiTask(field: string, current: string) {
  return () => generateText(aiSettings, { field, current, context: storyContext() });
}
</script>

<template>
  <div class="story-settings">
    <label :for="`kicker-${story.id}`">Label above headline</label>
    <div class="dice-row">
      <input
        :id="`kicker-${story.id}`"
        type="text"
        :value="story.kicker"
        @input="emit('update', { kicker: ($event.target as HTMLInputElement).value })"
      >
      <DiceButton
        :label="`Random label for story ${index + 1}`"
        @roll="emit('update', { kicker: randomFrom(KICKER_IDEAS, story.kicker) })"
      />
      <AiButton
        v-if="aiReady"
        :label="`AI label for story ${index + 1}`"
        :task="aiTask('Label above headline', story.kicker)"
        @result="(text) => emit('update', { kicker: text })"
      />
    </div>

    <label :for="`byline-${story.id}`">Byline</label>
    <div class="dice-row">
      <input
        :id="`byline-${story.id}`"
        type="text"
        :value="story.byline"
        @input="emit('update', { byline: ($event.target as HTMLInputElement).value })"
      >
      <DiceButton
        :label="`Random byline for story ${index + 1}`"
        @roll="emit('update', { byline: randomFrom(BYLINE_IDEAS, story.byline) })"
      />
      <AiButton
        v-if="aiReady"
        :label="`AI byline for story ${index + 1}`"
        :task="aiTask('Byline', story.byline)"
        @result="(text) => emit('update', { byline: text })"
      />
    </div>

    <label :for="`caption-${story.id}`">Photo caption</label>
    <div class="dice-row">
      <input
        :id="`caption-${story.id}`"
        type="text"
        :value="story.caption"
        @input="emit('update', { caption: ($event.target as HTMLInputElement).value })"
      >
      <DiceButton
        :label="`Random caption for story ${index + 1}`"
        @roll="emit('update', { caption: randomFrom(CAPTION_IDEAS, story.caption) })"
      />
      <AiButton
        v-if="aiReady"
        :label="`AI caption for story ${index + 1}`"
        :task="aiTask('Photo caption', story.caption)"
        @result="(text) => emit('update', { caption: text })"
      />
    </div>

    <label v-if="index > 0" class="check-row">
      <input
        type="checkbox"
        :checked="story.startsPage"
        @change="emit('update', { startsPage: ($event.target as HTMLInputElement).checked })"
      >
      Start on a new page
    </label>

    <label :for="`span-${story.id}`">Width</label>
    <select
      :id="`span-${story.id}`"
      :value="story.span"
      @change="emit('update', { span: ($event.target as HTMLSelectElement).value as Story['span'] })"
    >
      <option value="column">Single column</option>
      <option value="full">Full width</option>
    </select>

    <label :for="`photo-${story.id}`">Photo</label>
    <input :id="`photo-${story.id}`" type="file" accept="image/*" @change="onFile">
    <div class="button-row">
      <button v-if="photoUrl" type="button" @click="emit('clearPhoto')">Remove photo</button>
    </div>
  </div>
</template>
