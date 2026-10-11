// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { math } from './src/lib/math.mjs';

export default defineConfig({
  site: 'https://azusachino.com',
  // Links are written with a trailing slash and pages build to dir/index.html
  // (the URLs the MkDocs site had); 'ignore' also accepts the slash-less form,
  // so a typo still lands on the 404 page instead of the framework's error page.
  trailingSlash: 'ignore',
  devToolbar: { enabled: false },
  // Mermaid's chunks (~650 KB) load only on pages with a diagram, so Vite's
  // 500 KB warning is expected; keep the build log quiet for real warnings.
  vite: { build: { chunkSizeWarningLimit: 1024 } },
  markdown: {
    processor: satteri({ mdastPlugins: [math], features: { math: true } }),
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },
});
