// @ts-check
import { cpSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import type { AstroIntegration } from 'astro';
import { satteri } from '@astrojs/markdown-satteri';
import { math } from './src/lib/math';
import { archify } from './src/lib/archify';

const nativeImport = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;

function archifyIntegration(): AstroIntegration {
  return {
    name: 'archify',
    hooks: {
      'astro:config:setup': async ({ command }) => {
        // Type sync needs schemas, not public HTML; the build validates every diagram.
        if (command === 'sync') return;
        const { renderArchify } = await nativeImport(new URL('./scripts/archify.ts', import.meta.url).href);
        await renderArchify();
      },
    },
  };
}

function pagefindIntegration(): AstroIntegration {
  return {
    name: 'pagefind',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const site = fileURLToPath(dir);
        const pagefindBin = fileURLToPath(new URL('./node_modules/pagefind/lib/runner/bin.cjs', import.meta.url));
        if (existsSync(pagefindBin)) {
          execFileSync(process.execPath, [pagefindBin, '--site', site], { stdio: 'inherit' });
          const publicPagefind = fileURLToPath(new URL('./public/pagefind', import.meta.url));
          const distPagefind = fileURLToPath(new URL('./dist/pagefind', import.meta.url));
          if (existsSync(distPagefind)) {
            cpSync(distPagefind, publicPagefind, { recursive: true });
          }
        }
      },
    },
  };
}

export default defineConfig({
  site: 'https://azusachino.com',
  // Links are written with a trailing slash and pages build to dir/index.html
  // (the URLs the MkDocs site had); 'ignore' also accepts the slash-less form,
  // so a typo still lands on the 404 page instead of the framework's error page.
  trailingSlash: 'ignore',
  devToolbar: { enabled: false },
  integrations: [archifyIntegration(), pagefindIntegration()],
  // Mermaid's chunks (~650 KB) load only on pages with a diagram, so Vite's
  // 500 KB warning is expected; keep the build log quiet for real warnings.
  vite: {
    build: { chunkSizeWarningLimit: 1024 },
    server: { allowedHosts: ['harus-mini', 'harus-mini.talpidae-beta.ts.net', 'harus-macmini', 'harus-macmini.talpidae-beta.ts.net'] },
    preview: { allowedHosts: ['harus-mini', 'harus-mini.talpidae-beta.ts.net', 'harus-macmini', 'harus-macmini.talpidae-beta.ts.net'] },
  },
  markdown: {
    processor: satteri({ mdastPlugins: [math, archify], features: { math: true } }),
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },
});
