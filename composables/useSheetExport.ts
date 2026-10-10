import { ref } from "vue";
import { toBlob, toCanvas } from "html-to-image";
import { STRIP_GAP, exportFileName, exportPixelRatio } from "../src/export.ts";

// Renders the newspaper sheets to PNG downloads: one file per sheet, or one tall file with the
// sheets stacked top to bottom. Everything runs in the browser.
export function useSheetExport(name: () => string, sheets: () => HTMLElement[]) {
  const busy = ref(false);
  const error = ref("");

  async function run(task: (elements: HTMLElement[]) => Promise<void>) {
    const elements = sheets();
    if (busy.value || elements.length === 0) return;
    busy.value = true;
    error.value = "";
    try {
      await task(elements);
    } catch (cause) {
      error.value = `Export failed: ${cause instanceof Error ? cause.message : String(cause)}`;
    } finally {
      busy.value = false;
    }
  }

  function exportPages() {
    return run(async (elements) => {
      for (const [index, sheet] of elements.entries()) {
        const ratio = exportPixelRatio(sheet.offsetWidth, sheet.offsetHeight);
        const blob = await toBlob(sheet, { pixelRatio: ratio });
        if (!blob) throw new Error(`page ${index + 1} could not be rendered`);
        download(blob, exportFileName(name(), `page-${index + 1}`));
      }
    });
  }

  function exportStrip() {
    return run(async (elements) => {
      const width = Math.max(...elements.map((sheet) => sheet.offsetWidth));
      const height = elements.reduce((sum, sheet) => sum + sheet.offsetHeight, 0)
        + STRIP_GAP * (elements.length - 1);
      const ratio = exportPixelRatio(width, height);
      const canvases: HTMLCanvasElement[] = [];
      for (const sheet of elements) {
        canvases.push(await toCanvas(sheet, { pixelRatio: ratio }));
      }

      const gap = Math.round(STRIP_GAP * ratio);
      const out = document.createElement("canvas");
      out.width = Math.max(...canvases.map((canvas) => canvas.width));
      out.height = canvases.reduce((sum, canvas) => sum + canvas.height, 0) + gap * (canvases.length - 1);
      const context = out.getContext("2d");
      if (!context) throw new Error("this browser cannot draw the image");
      context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--page-bg").trim() || "#d9cfb8";
      context.fillRect(0, 0, out.width, out.height);
      let y = 0;
      for (const canvas of canvases) {
        context.drawImage(canvas, (out.width - canvas.width) / 2, y);
        y += canvas.height + gap;
      }

      download(await encodePng(out), exportFileName(name(), "long"));
    });
  }

  return { busy, error, exportPages, exportStrip };
}

function encodePng(canvas: HTMLCanvasElement): Promise<Blob> {
  const { promise, resolve, reject } = Promise.withResolvers<Blob>();
  canvas.toBlob((blob) => {
    if (blob) resolve(blob);
    else reject(new Error("the image could not be encoded"));
  }, "image/png");
  return promise;
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  // Revoking at once can cancel the download in some browsers, so give it a moment.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
