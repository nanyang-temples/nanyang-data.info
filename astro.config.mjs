import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import image from "@astrojs/image";

// https://astro.build/config
export default defineConfig({
  site: "https://nanyang-data.info/",
  sitemap: true,
  integrations: [sitemap(), mdx(), image()],
  vite: {
    ssr: {
      external: ["svgo"],
    },
  },  
});
