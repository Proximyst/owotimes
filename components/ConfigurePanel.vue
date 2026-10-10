<script setup lang="ts">
import type { Edition, EditionText } from "../src/edition.ts";
import {
  BODY_SIZE_RANGE,
  COLUMN_RANGE,
  CRUMPLE_RANGE,
  CUSTOM_HEIGHT_RANGE,
  CUSTOM_WIDTH_RANGE,
  FONT_PRESETS,
  PAPER_SIZE_LABELS,
  type Layout,
  type PaperSize,
} from "../src/layout.ts";
import { CRUMPLE_METHODS, PAPER_COLOURS, type CrumpleMethod } from "../src/paper.ts";
import { PRICE_IDEAS, TAGLINE_IDEAS, TOP_RIGHT_IDEAS, randomFrom } from "../src/pools.ts";
import { AI_PROVIDER_PRESETS, generateText } from "../src/ai.ts";
import { useAiSettings } from "../composables/useAiSettings.ts";
import { editionContext } from "../src/edition.ts";

const props = defineProps<{ edition: Edition }>();
const { settings: aiSettings, ready: aiReady, update: updateAi } = useAiSettings();

const emit = defineEmits<{
  publication: [changes: Partial<Pick<Edition, "name" | "paperColor" | "date">>];
  text: [changes: Partial<EditionText>];
  layout: [changes: Partial<Layout>];
  reset: [];
}>();

const paperSizes = Object.keys(PAPER_SIZE_LABELS) as PaperSize[];
const columnOptions = Array.from(
  { length: COLUMN_RANGE.max - COLUMN_RANGE.min + 1 },
  (_, offset) => COLUMN_RANGE.min + offset,
);

type TextField = { key: keyof EditionText; label: string; pool?: readonly string[] };

const textFields: TextField[] = [
  { key: "topLeft", label: "Top left", pool: PRICE_IDEAS },
  { key: "topRight", label: "Top right", pool: TOP_RIGHT_IDEAS },
  { key: "tagline", label: "Tagline under masthead", pool: TAGLINE_IDEAS },
  { key: "banner", label: "Banner line" },
  { key: "footer", label: "Footer" },
];

function rollText(field: TextField) {
  if (!field.pool) return;
  emit("text", { [field.key]: randomFrom(field.pool, props.edition.text[field.key]) });
}

// Removes stories, photos, text, and layout. AI settings live in their own storage and survive.
function resetEdition() {
  if (window.confirm("Reset the newspaper? All stories, photos, text, and layout will be removed. AI settings are kept.")) emit("reset");
}

function aiTask(field: TextField) {
  return () => generateText(aiSettings, {
    field: field.label,
    current: props.edition.text[field.key],
    context: editionContext(props.edition),
  });
}

type FontField = "mastheadFont" | "headlineFont" | "bodyFont";

const fontFields: { key: FontField; label: string }[] = [
  { key: "mastheadFont", label: "Masthead font" },
  { key: "headlineFont", label: "Headline font" },
  { key: "bodyFont", label: "Body font" },
];
</script>

<template>
  <section class="configure-panel" aria-label="Configure newspaper">
    <fieldset>
      <legend>Publication</legend>
      <label for="cfg-name">Name</label>
      <input
        id="cfg-name"
        type="text"
        :value="edition.name"
        @input="emit('publication', { name: ($event.target as HTMLInputElement).value })"
      >
      <label for="cfg-date">Date line</label>
      <input
        id="cfg-date"
        type="text"
        :value="edition.date"
        @input="emit('publication', { date: ($event.target as HTMLInputElement).value })"
      >
      <label for="cfg-tone">Paper tone</label>
      <div class="swatch-row">
        <button
          v-for="colour in PAPER_COLOURS"
          :key="colour.hex"
          type="button"
          class="swatch"
          :class="{ 'is-selected': edition.paperColor.toLowerCase() === colour.hex }"
          :style="{ background: colour.hex }"
          :title="colour.name"
          :aria-label="`Paper tone: ${colour.name}`"
          @click="emit('publication', { paperColor: colour.hex })"
        ></button>
        <input
          id="cfg-tone"
          type="color"
          :value="edition.paperColor"
          @input="emit('publication', { paperColor: ($event.target as HTMLInputElement).value })"
        >
      </div>
    </fieldset>

    <fieldset>
      <legend>Masthead, labels, and footer text</legend>
      <template v-for="field in textFields" :key="field.key">
        <label :for="`cfg-text-${field.key}`">{{ field.label }}</label>
        <div class="dice-row">
          <input
            :id="`cfg-text-${field.key}`"
            type="text"
            :value="edition.text[field.key]"
            @input="emit('text', { [field.key]: ($event.target as HTMLInputElement).value })"
          >
          <DiceButton
            v-if="field.pool"
            :label="`Random ${field.label.toLowerCase()}`"
            @roll="rollText(field)"
          />
          <AiButton
            v-if="aiReady"
            :label="`AI ${field.label.toLowerCase()}`"
            :task="aiTask(field)"
            @result="(text) => emit('text', { [field.key]: text })"
          />
        </div>
      </template>
    </fieldset>

    <fieldset>
      <legend>AI text (bring your own key)</legend>
      <div class="button-row">
        <button
          v-for="preset in AI_PROVIDER_PRESETS"
          :key="preset.id"
          type="button"
          :class="{ 'is-selected': aiSettings.baseUrl === preset.baseUrl }"
          @click="updateAi({ baseUrl: preset.baseUrl, model: preset.model })"
        >
          {{ preset.label }}
        </button>
      </div>
      <p class="field-hint">A preset fills the endpoint and a default model. Enter your own key, and change the model if you want another.</p>
      <label class="check-row">
        <input
          type="checkbox"
          :checked="aiSettings.enabled"
          @change="updateAi({ enabled: ($event.target as HTMLInputElement).checked })"
        >
        Show AI buttons next to the randomize buttons
      </label>
      <label for="ai-base-url">API endpoint</label>
      <input
        id="ai-base-url"
        type="url"
        :value="aiSettings.baseUrl"
        placeholder="https://api.openai.com/v1"
        @input="updateAi({ baseUrl: ($event.target as HTMLInputElement).value })"
      >
      <label for="ai-model">Model</label>
      <input
        id="ai-model"
        type="text"
        :value="aiSettings.model"
        placeholder="e.g. gpt-4o-mini"
        @input="updateAi({ model: ($event.target as HTMLInputElement).value })"
      >
      <label for="ai-key">API key</label>
      <input
        id="ai-key"
        type="password"
        autocomplete="off"
        :value="aiSettings.apiKey"
        @input="updateAi({ apiKey: ($event.target as HTMLInputElement).value })"
      >
      <label for="ai-temperature">Temperature (0 steady, 2 wild)</label>
      <input
        id="ai-temperature"
        type="number"
        min="0"
        max="2"
        step="0.1"
        :value="aiSettings.temperature"
        @input="updateAi({ temperature: Number(($event.target as HTMLInputElement).value) })"
      >
      <label for="ai-instructions">Extra instructions for the model</label>
      <textarea
        id="ai-instructions"
        rows="3"
        :value="aiSettings.instructions"
        @input="updateAi({ instructions: ($event.target as HTMLTextAreaElement).value })"
      />
      <p class="field-hint">Settings stay in this browser and the key is sent only to the endpoint above. AI buttons appear once AI is on and a model and key are set.</p>
    </fieldset>

    <fieldset>
      <legend>Paper and columns</legend>
      <label for="cfg-paper">Paper size</label>
      <select
        id="cfg-paper"
        :value="edition.layout.paperSize"
        @change="emit('layout', { paperSize: ($event.target as HTMLSelectElement).value as PaperSize })"
      >
        <option v-for="size in paperSizes" :key="size" :value="size">{{ PAPER_SIZE_LABELS[size] }}</option>
      </select>

      <template v-if="edition.layout.paperSize === 'Custom'">
        <label for="cfg-width">Width: {{ edition.layout.customWidthMm }} mm</label>
        <input
          id="cfg-width"
          type="range"
          :min="CUSTOM_WIDTH_RANGE.min"
          :max="CUSTOM_WIDTH_RANGE.max"
          step="1"
          :value="edition.layout.customWidthMm"
          @input="emit('layout', { customWidthMm: Number(($event.target as HTMLInputElement).value) })"
        >
        <label for="cfg-height">Height: {{ edition.layout.customHeightMm }} mm</label>
        <input
          id="cfg-height"
          type="range"
          :min="CUSTOM_HEIGHT_RANGE.min"
          :max="CUSTOM_HEIGHT_RANGE.max"
          step="1"
          :value="edition.layout.customHeightMm"
          @input="emit('layout', { customHeightMm: Number(($event.target as HTMLInputElement).value) })"
        >
      </template>

      <label for="cfg-columns">Columns</label>
      <select
        id="cfg-columns"
        :value="edition.layout.columns"
        @change="emit('layout', { columns: Number(($event.target as HTMLSelectElement).value) })"
      >
        <option v-for="count in columnOptions" :key="count" :value="count">{{ count }}</option>
      </select>

      <label for="cfg-body-size">Body text size: {{ edition.layout.bodySize }} pt</label>
      <input
        id="cfg-body-size"
        type="range"
        :min="BODY_SIZE_RANGE.min"
        :max="BODY_SIZE_RANGE.max"
        step="1"
        :value="edition.layout.bodySize"
        @input="emit('layout', { bodySize: Number(($event.target as HTMLInputElement).value) })"
      >
      <label for="cfg-crumple">Paper crumple: {{ edition.layout.crumple }}%</label>
      <input
        id="cfg-crumple"
        type="range"
        :min="CRUMPLE_RANGE.min"
        :max="CRUMPLE_RANGE.max"
        step="1"
        :value="edition.layout.crumple"
        @input="emit('layout', { crumple: Number(($event.target as HTMLInputElement).value) })"
      >
      <label for="cfg-crumple-method">Crumple method</label>
      <select
        id="cfg-crumple-method"
        :value="edition.layout.crumpleMethod"
        @change="emit('layout', { crumpleMethod: ($event.target as HTMLSelectElement).value as CrumpleMethod })"
      >
        <option v-for="(method, key) in CRUMPLE_METHODS" :key="key" :value="key">{{ method.label }}</option>
      </select>
    </fieldset>

    <fieldset>
      <legend>Fonts</legend>
      <p class="field-hint">Type any font name. Bundled fonts work everywhere; other names use the reader's installed fonts.</p>
      <datalist id="font-presets">
        <option v-for="font in FONT_PRESETS" :key="font" :value="font" />
      </datalist>
      <template v-for="field in fontFields" :key="field.key">
        <label :for="`cfg-${field.key}`">{{ field.label }}</label>
        <input
          :id="`cfg-${field.key}`"
          type="text"
          list="font-presets"
          :value="edition.layout[field.key]"
          @input="emit('layout', { [field.key]: ($event.target as HTMLInputElement).value })"
        >
      </template>
    </fieldset>
    <fieldset>
      <legend>Reset</legend>
      <p class="field-hint">Restores the default newspaper. All stories, photos, text, and layout are removed. AI settings are kept.</p>
      <button type="button" class="button-danger" @click="resetEdition">Reset newspaper</button>
    </fieldset>
  </section>
</template>
