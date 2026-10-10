<script setup lang="ts">
import { computed } from "vue";
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
</script>

<template>
  <div class="newspaper" :style="cssVars">
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
    <section class="paper-columns" aria-label="Newspaper stories">
      <article
        v-for="story in view.stories"
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
        <p class="story-byline">{{ view.text.byline }}</p>
        <p v-for="(text, n) in story.paragraphs" :key="n" class="story-copy"><MarkdownText :source="text" /></p>
      </article>
    </section>
    <footer v-if="view.text.footer" class="paper-footer">{{ view.text.footer }}</footer>
  </div>
</template>
