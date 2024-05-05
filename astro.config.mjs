import { defineConfig } from "astro/config";
import icon from "astro-icon";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import yaml from "@rollup/plugin-yaml";

export default defineConfig({
  site: "https://nanyang-data.info/",
  sitemap: true,
  integrations: [icon(), mdx(), sitemap()],
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
