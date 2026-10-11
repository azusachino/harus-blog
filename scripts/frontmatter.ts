// The frontmatter contract (see ../AGENTS.md); it predates Astro (it was an
// MkDocs build hook). The content-collection schema checks types and
// lowercase categories/tags; this checks presence and key order.
// Usage: bun scripts/frontmatter.ts  (exits 1 and lists every problem)
import { readFileSync } from 'node:fs';
import { Glob } from 'bun';

const DOCS = new URL('../docs/', import.meta.url).pathname;
const CONTENT_DIRS = ['tech/posts', 'tech/series', 'journal', 'life'];
const REQUIRED = ['title', 'date', 'description', 'categories', 'slug', 'comments'];
// Optional keys still have a fixed place: after comments.
const ORDER = [...REQUIRED, 'cover', 'cover_alt'];
const SERIES_REQUIRED = ['title', 'description'];
const EXEMPT = new Set(['index.md', 'about.md', 'cv.md']);

function check(rel: string): string[] {
  const text = readFileSync(DOCS + rel, 'utf8');
  const match = /^---\n([\s\S]*?)\n---/.exec(text);
  if (!match) return ['missing frontmatter'];
  // Top-level keys only: unindented `key:` lines.
  const keys = [...match[1].matchAll(/^([A-Za-z_][\w-]*):/gm)].map((m) => m[1]);
  const required = rel.startsWith('tech/series/') ? SERIES_REQUIRED : REQUIRED;
  const problems = required.filter((k) => !keys.includes(k)).map((k) => `missing key '${k}'`);
  const present = keys.filter((k) => ORDER.includes(k));
  const expected = ORDER.filter((k) => keys.includes(k));
  if (present.join() !== expected.join()) problems.push(`key order [${present}] should be [${expected}]`);
  if (required.includes('comments') && !/^comments:\s*true\s*$/m.test(match[1])) problems.push("'comments' must be true");
  return problems;
}

const failures: string[] = [];
let checked = 0;
for (const dir of CONTENT_DIRS) {
  for (const rel of new Glob(`${dir}/**/*.md`).scanSync(DOCS)) {
    if (EXEMPT.has(rel.split('/').pop()!)) continue;
    checked++;
    for (const p of check(rel)) failures.push(`${rel}: ${p}`);
  }
}
for (const f of failures.sort()) console.error(`FAIL ${f}`);
console.log(`${checked} content files: ${failures.length ? `${failures.length} problems` : 'frontmatter contract holds'}`);
process.exit(failures.length ? 1 : 0);
