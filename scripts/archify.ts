import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const BLOG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS_ROOT = join(BLOG_ROOT, 'docs');
const OUT_ROOT = join(BLOG_ROOT, 'public', 'archify');
// The `archify` devDependency (a tarball from the fork's releases) supplies the renderer.
const RENDER_API = createRequire(import.meta.url).resolve('archify/lib/render.mjs');
const SOURCE = /\.(architecture|workflow|sequence|dataflow|lifecycle|erd|class|tree|timeline|waterfall)\.json$/;

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (
      entry.name.startsWith('.') ||
      entry.name === 'node_modules' ||
      entry.name === 'public' ||
      entry.name === 'dist'
    ) {
      continue;
    }
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (SOURCE.test(entry.name)) out.push(full);
  }
  return out;
}

export async function renderArchify() {
  const sources = walk(DOCS_ROOT);
  if (sources.length === 0) {
    if (existsSync(OUT_ROOT)) {
      rmSync(OUT_ROOT, { recursive: true, force: true });
    }
    return;
  }
  if (!existsSync(RENDER_API)) {
    throw new Error(`archify: renderer not found at ${RENDER_API}; run 'bun install'`);
  }
  const { renderHtml } = await import(pathToFileURL(RENDER_API).href);
  rmSync(OUT_ROOT, { recursive: true, force: true });

  for (const source of sources) {
    const type = source.match(SOURCE)![1];
    const rel = relative(DOCS_ROOT, source);
    const diagram = JSON.parse(readFileSync(source, 'utf8'));
    let html: string;
    try {
      html = await renderHtml(type, diagram);
    } catch (error) {
      throw new Error(`archify: docs/${rel}: ${(error as Error).message}`);
    }
    const out = join(OUT_ROOT, rel.replace(/\.json$/, '.html'));
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, html);
  }
}

if (import.meta.main) {
  await renderArchify();
}
