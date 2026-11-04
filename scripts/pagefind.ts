import { cpSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BLOG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST_ROOT = join(BLOG_ROOT, 'dist');
const PUBLIC_PAGEFIND = join(BLOG_ROOT, 'public', 'pagefind');
const DIST_PAGEFIND = join(DIST_ROOT, 'pagefind');

const PAGEFIND_RUNNER = resolve(BLOG_ROOT, 'node_modules', 'pagefind', 'lib', 'runner', 'bin.cjs');

export function runPagefind(siteDir: string = DIST_ROOT): void {
  if (!existsSync(PAGEFIND_RUNNER)) {
    throw new Error(`pagefind: runner binary not found at ${PAGEFIND_RUNNER}`);
  }
  if (!existsSync(siteDir)) {
    throw new Error(`pagefind: site directory not found at ${siteDir}; run build first`);
  }

  execFileSync(process.execPath, [PAGEFIND_RUNNER, '--site', siteDir], { stdio: 'inherit' });

  if (existsSync(DIST_PAGEFIND)) {
    cpSync(DIST_PAGEFIND, PUBLIC_PAGEFIND, { recursive: true });
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  runPagefind();
}
