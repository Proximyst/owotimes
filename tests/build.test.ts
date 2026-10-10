import { beforeAll, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const OUTPUT = ".output/public";

describe("static generation output", () => {
  beforeAll(async () => {
    const build = Bun.spawn(["bun", "run", "build"], { stdout: "pipe", stderr: "pipe" });
    const exitCode = await build.exited;
    if (exitCode !== 0) {
      throw new Error(`bun run build failed:\n${await new Response(build.stderr).text()}`);
    }
  }, 300_000);

  test("generates an index page that references the client bundle and stylesheet", async () => {
    const html = await readFile(join(OUTPUT, "index.html"), "utf8");

    expect(html).toContain("Newspaper");
    expect(html).toMatch(/_nuxt\/[^"']+\.js/);
    expect(html).toMatch(/_nuxt\/[^"']+\.css/);
  });

  test("print styles hide the editor and print controls", async () => {
    const html = await readFile(join(OUTPUT, "index.html"), "utf8");
    const cssHref = html.match(/href="([^"]*_nuxt\/[^"]+\.css)"/)?.[1];
    expect(cssHref).toBeTruthy();

    const css = await readFile(join(OUTPUT, cssHref!), "utf8");
    const printBlock = css.slice(css.indexOf("@media print"));

    expect(printBlock).toContain(".no-print");
    expect(printBlock).toContain(".editor-panel");
  });
});
