import { shallowRef } from "vue";

export type DragItem = { kind: "story"; id: string };

// Module-level so every story editor shares the one in-flight drag.
const active = shallowRef<DragItem | null>(null);

export function useDragState() {
  return {
    active,
    start(item: DragItem, dataTransfer: DataTransfer | null) {
      active.value = item;
      if (dataTransfer) {
        // Firefox only starts a drag when some data has been set.
        dataTransfer.setData("text/plain", item.id);
        dataTransfer.effectAllowed = "move";
      }
    },
    end() {
      active.value = null;
    },
  };
}
