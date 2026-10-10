<script setup lang="ts">
import { computed, onMounted, onUpdated, ref } from "vue";
import type { NewspaperView } from "../src/render.ts";

const props = defineProps<{ view: NewspaperView }>();

const cssVars = computed(() => ({
  "--paper-tone": props.view.paperColor,
  "--paper-width": props.view.layout.paperWidth,
  "--paper-height": props.view.layout.paperHeight,
  "--columns": String(props.view.layout.columns),
  "--font-masthead": props.view.layout.mastheadFont,
  "--font-headline": props.view.layout.headlineFont,
  "--font-body": props.view.layout.bodyFont,
  "--body-size": props.view.layout.bodySize,
  "--paper-crumple": props.view.layout.crumpleImage,
}));

// Sheets are fixed to the paper size, so content that does not fit is cut off. Flag it.
const sheets: (HTMLElement | undefined)[] = [];
const overflowing = ref<boolean[]>([]);

function setSheet(index: number, el: unknown) {
  sheets[index] = el instanceof HTMLElement ? el : undefined;
}

function measure() {
  const next = props.view.pages.map((_, index) => {
    const sheet = sheets[index];
    return sheet ? sheet.scrollHeight > sheet.clientHeight + 1 : false;
  });
  // Only assign when something changed, or the update hook would loop forever.
  const changed = next.length !== overflowing.value.length || next.some((flag, index) => flag !== overflowing.value[index]);
  if (changed) overflowing.value = next;
}

onMounted(measure);
onUpdated(measure);
</script>

<template>
  <div class="newspaper-pages">
    <div v-for="(page, pageIndex) in view.pages" :key="page.number" class="sheet-wrap">
      <div :ref="(el) => setSheet(pageIndex, el)" class="newspaper" :style="cssVars">
        <template v-if="page.number === 1">
          <header class="paper-masthead">
            <div v-if="view.text.topLeft || view.text.topRight" class="paper-topline">
              <span>{{ view.text.topLeft }}</span>
              <span>{{ view.text.topRight }}</span>
            </div>
            <h1>{{ view.name }}</h1>
            <div class="paper-dateline">
              <span v-if="view.text.tagline">{{ view.text.tagline }}</span>
              <time>{{ view.date }}</time>
            </div>
          </header>
          <div v-if="view.text.banner" class="paper-banner">{{ view.text.banner }}</div>
        </template>
        <header v-else class="paper-running-head">
          <span>{{ view.name }}</span>
          <time>{{ view.date }}</time>
          <span>Page {{ page.number }}</span>
        </header>
        <section class="paper-columns" aria-label="Newspaper stories">
          <article
            v-for="story in page.stories"
            :key="story.id"
            class="paper-story"
            :class="{ 'paper-story-lead': story.isLead, 'paper-story-full': story.isFull }"
          >
            <figure v-if="story.imageUrl" class="paper-figure">
              <img :src="story.imageUrl" :alt="story.headline">
              <figcaption>{{ story.caption }}</figcaption>
            </figure>
            <p class="story-kicker">{{ story.kicker }}</p>
            <h2>{{ story.headline }}</h2>
            <p class="story-byline">{{ story.byline }}</p>
            <p v-for="(text, n) in story.paragraphs" :key="n" class="story-copy"><MarkdownText :source="text" /></p>
          </article>
        </section>
        <footer v-if="view.text.footer && pageIndex === view.pages.length - 1" class="paper-footer">{{ view.text.footer }}</footer>
      </div>
      <p v-if="overflowing[pageIndex]" class="overflow-warning no-print" role="alert">
        Page {{ page.number }} is too long and its bottom is cut off. Shorten text or start a new page earlier.
      </p>
    </div>
  </div>
</template>
