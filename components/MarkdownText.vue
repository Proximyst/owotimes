<script setup lang="ts">
import { computed } from "vue";
import { parseInline } from "../src/markdown.ts";

const props = defineProps<{ source: string }>();
const segments = computed(() => parseInline(props.source));
</script>

<template>
  <span
    v-for="(segment, n) in segments"
    :key="n"
    :class="{ 'md-bold': segment.bold, 'md-italic': segment.italic }"
  >{{ segment.text }}</span>
</template>
