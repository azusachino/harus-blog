// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { postCover } from './src/lib/post-cover.mjs';

export default defineConfig({
  site: 'https://azusachino.com',
  // Links are written with a trailing slash and pages build to dir/index.html
  // (same URLs as MkDocs); 'ignore' also accepts the slash-less form, so a
  // typo still lands on the 404 page instead of the framework's error page.
  trailingSlash: 'ignore',
  devToolbar: { enabled: false },
  markdown: {
    processor: satteri({ mdastPlugins: [postCover], features: { math: true } }),
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },
});
