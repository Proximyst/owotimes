import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

describe("Nuxt static project contract", () => {
  test("configures Nuxt generation and a browser-only application", async () => {
    const packageJson = JSON.parse(await readFile("package.json", "utf8"));
    const config = await readFile("nuxt.config.ts", "utf8");
    const page = await readFile("pages/index.vue", "utf8");

    expect(packageJson.scripts.build).toBe("nuxt generate");
    expect(packageJson.dependencies.nuxt).toBeTruthy();
    expect(config).toContain("ssr: false");
    expect(page).toContain("Newspaper");
  });
});
