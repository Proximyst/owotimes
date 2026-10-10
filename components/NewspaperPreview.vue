<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { paginate, splittableWord, unitKey, type NewspaperView } from "../src/render.ts";

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

// Breaks found by measuring the rendered sheets, as unit keys, on top of the manual page starts.
const autoBreaks = ref<string[]>([]);
const breaks = computed(() => new Set([...props.view.pageStarts, ...autoBreaks.value]));
const pages = computed(() => paginate(props.view.stories, breaks.value));

const sheets: (HTMLElement | undefined)[] = [];
const overflowing = ref<boolean[]>([]);

function setSheet(index: number, el: unknown) {
  sheets[index] = el instanceof HTMLElement ? el : undefined;
}

// Text that does not fit spills past the last column or below the sheet.
function sheetOverflows(index: number): boolean {
  const columns = sheets[index]?.querySelector<HTMLElement>(".paper-columns");
  if (!columns) return false;
  return columns.scrollWidth > columns.clientWidth + 1 || columns.scrollHeight > columns.clientHeight + 1;
}

// The first word, in reading order, that starts past the last column. Returns the element that
// holds it: a paragraph piece, or a story part's header or figure.
function firstOverflowingWord(columns: HTMLElement): { owner: HTMLElement; word: number } | null {
  const limit = columns.getBoundingClientRect().right;
  const counts = new Map<HTMLElement, number>();
  const walker = document.createTreeWalker(columns, NodeFilter.SHOW_TEXT);
  let inWord = false;
  let previousBlock: Element | null = null;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent ?? "";
    const element = node.parentElement;
    // A word cannot continue across a block boundary, even when no space separates the text.
    const block = element?.closest("p, h1, h2, figcaption") ?? null;
    if (block !== previousBlock) inWord = false;
    previousBlock = block;
    const owner = element?.closest<HTMLElement>(".story-copy, .paper-story") ?? null;
    for (let i = 0; i < text.length; i++) {
      if (/\s/.test(text.charAt(i))) {
        inWord = false;
        continue;
      }
      if (inWord) continue;
      inWord = true;
      if (!owner) continue;
      const word = counts.get(owner) ?? 0;
      counts.set(owner, word + 1);
      const range = document.createRange();
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      if (range.getBoundingClientRect().left >= limit) return { owner, word };
    }
  }
  return null;
}

// A break is new when no page starts there yet.
function freshBreak(key: string | undefined): string | null {
  return key && !breaks.value.has(key) ? key : null;
}

// The break that moves the first overflowing word to the next page, or null when none can be
// placed: the overflow sits at a point that already starts a page, or no split avoids cutting
// bold or italic markup.
function breakForPage(sheet: HTMLElement): string | null {
  const columns = sheet.querySelector<HTMLElement>(".paper-columns");
  const hit = columns ? firstOverflowingWord(columns) : null;
  if (!hit) return null;
  const { owner, word } = hit;
  if (owner.dataset.paragraph === undefined) {
    // A headline, byline, or figure overflows, so the whole story part moves to the next page.
    return freshBreak(owner.dataset.key);
  }
  const storyId = owner.dataset.story ?? "";
  const paragraph = Number(owner.dataset.paragraph);
  const piece = Number(owner.dataset.word);
  const text = props.view.stories.find((story) => story.id === storyId)?.paragraphs[paragraph];
  if (text === undefined) return null;
  const split = splittableWord(text, piece + word);
  // A split at or before this piece's own start would not move any text forward.
  if (split < piece) return null;
  return freshBreak(unitKey(storyId, paragraph, split));
}

// Each pass measures the rendered pages and adds one break, on the first overflowing page that
// can take one. Measuring again after every break keeps later pages in step with the layout
// they will have. A break is never added twice, so the loop ends.
let run = 0;
async function paginateSheets() {
  const current = ++run;
  autoBreaks.value = [];
  for (;;) {
    await nextTick();
    if (current !== run) return;
    const flags = pages.value.map((_, index) => sheetOverflows(index));
    overflowing.value = flags;
    let key: string | null = null;
    for (let index = 0; index < flags.length && !key; index++) {
      const sheet = sheets[index];
      if (flags[index] && sheet) key = breakForPage(sheet);
    }
    if (!key) return;
    autoBreaks.value = [...autoBreaks.value, key];
  }
}

onMounted(paginateSheets);
watch(() => props.view, paginateSheets);

// The rendered sheets in page order, for PNG export.
function sheetElements(): HTMLElement[] {
  return pages.value.map((_, index) => sheets[index]).filter((sheet): sheet is HTMLElement => sheet !== undefined);
}

defineExpose({ sheetElements });
</script>

<template>
  <div class="newspaper-pages">
    <div v-for="(page, pageIndex) in pages" :key="page.number" class="sheet-wrap">
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
            :key="story.key"
            class="paper-story"
            :class="{ 'paper-story-lead': story.isLead, 'paper-story-full': story.isFull }"
            :data-key="story.key"
          >
            <template v-if="!story.continued">
              <figure v-if="story.imageUrl" class="paper-figure">
                <img :src="story.imageUrl" :alt="story.headline">
                <figcaption>{{ story.caption }}</figcaption>
              </figure>
              <p class="story-kicker">{{ story.kicker }}</p>
              <h2>{{ story.headline }}</h2>
              <p class="story-byline">{{ story.byline }}</p>
            </template>
            <p
              v-for="piece in story.paragraphs"
              :key="unitKey(story.id, piece.index, piece.word)"
              class="story-copy"
              :data-story="story.id"
              :data-paragraph="piece.index"
              :data-word="piece.word"
            ><MarkdownText :source="piece.text" /></p>
          </article>
        </section>
        <footer v-if="view.text.footer && pageIndex === pages.length - 1" class="paper-footer">{{ view.text.footer }}</footer>
      </div>
      <p v-if="overflowing[pageIndex]" class="overflow-warning no-print" role="alert">
        Page {{ page.number }} has a paragraph longer than the page, so its end is cut off. Split it with a blank line.
      </p>
    </div>
  </div>
</template>
