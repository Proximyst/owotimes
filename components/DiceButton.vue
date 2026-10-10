<script setup lang="ts">
defineProps<{ label: string }>();
const emit = defineEmits<{ roll: [] }>();
</script>

<template>
  <button type="button" class="dice-button" :title="label" :aria-label="label" @click="emit('roll')">
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16" cy="16" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  </button>
</template>
