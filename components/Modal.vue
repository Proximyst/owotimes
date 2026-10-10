<script setup lang="ts">
import { onMounted, ref } from "vue";

const props = defineProps<{ title: string }>();
const emit = defineEmits<{ close: [] }>();
const dialog = ref<HTMLDialogElement | null>(null);

onMounted(() => dialog.value?.showModal());
</script>

<template>
  <dialog ref="dialog" class="modal" :aria-label="props.title" @close="emit('close')">
    <header class="modal-head">
      <h2>{{ props.title }}</h2>
      <button type="button" @click="dialog?.close()">Done</button>
    </header>
    <slot />
  </dialog>
</template>
