import { onBeforeUnmount, onMounted, ref } from "vue";

export const DEFAULT_EDITOR_WIDTH = 380;
const MIN_EDITOR_WIDTH = 280;
// The app shell leaves 1.5rem (24px) at each window edge on both sides.
const SHELL_INSET = 24;

// Keeps the stories panel between its minimum width and the window's inner width.
export function clampEditorWidth(value: number, windowWidth: number): number {
  const max = Math.max(MIN_EDITOR_WIDTH, windowWidth - 2 * SHELL_INSET);
  return Math.round(Math.max(MIN_EDITOR_WIDTH, Math.min(value, max)));
}

// Width of the stories panel in px. Dragging its edge widens it. Past the preview's default
// column it covers the newspaper, so stories can be edited without the preview.
export function useEditorWidth() {
  const width = ref(DEFAULT_EDITOR_WIDTH);
  let drag: { pointerId: number; startX: number; startWidth: number } | null = null;

  function clamp(value: number): number {
    return clampEditorWidth(value, window.innerWidth);
  }

  function startDrag(event: PointerEvent) {
    drag = { pointerId: event.pointerId, startX: event.clientX, startWidth: width.value };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function moveDrag(event: PointerEvent) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    width.value = clamp(drag.startWidth + event.clientX - drag.startX);
  }

  function endDrag(event: PointerEvent) {
    if (drag?.pointerId === event.pointerId) drag = null;
  }

  function nudge(delta: number) {
    width.value = clamp(width.value + delta);
  }

  // Keeps the panel inside the window when the window shrinks.
  function fitWindow() {
    width.value = clamp(width.value);
  }

  onMounted(() => window.addEventListener("resize", fitWindow));
  onBeforeUnmount(() => window.removeEventListener("resize", fitWindow));

  return { width, startDrag, moveDrag, endDrag, nudge };
}
