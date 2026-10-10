// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-04-15",
  devtools: { enabled: false },
  css: [
    "~/assets/css/main.css",
    // Self-hosted Google Fonts: bundled with the static build, no runtime request.
    "@fontsource/playfair-display/400.css",
    "@fontsource/playfair-display/400-italic.css",
    "@fontsource/playfair-display/700.css",
    "@fontsource/playfair-display/900.css",
    "@fontsource/playfair-display/900-italic.css",
    "@fontsource/unifrakturmaguntia/400.css",
  ],
  ssr: false,
  app: {
    head: {
      title: "OwO Times | Newspaper Studio",
      meta: [
        { name: "description", content: "Compose your own wonderfully old-fashioned newspaper." },
        { name: "theme-color", content: "#e9e0cc" },
      ],
    },
  },
});
