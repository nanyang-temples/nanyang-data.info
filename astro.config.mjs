import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import yaml from "@rollup/plugin-yaml";

// https://astro.build/config
export default defineConfig({
  site: "https://nanyang-data.info/",
  sitemap: true,
  integrations: [mdx(), sitemap()],
  build: {
    assets: "assets",
  },
  vite: {
    plugins: [yaml()],
    ssr: {
      external: ["svgo"],
    },
  },
});
