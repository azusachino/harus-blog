// URL parity with the MkDocs site: every URL it served must exist in the
// Astro build, or be a pagination URL that Caddy redirects (see the
// harus-k3s Caddyfile). scripts/mkdocs-urls.txt is the last MkDocs build's
// page list, one path per line without the trailing slash.
// Usage (after `astro build`): bun scripts/url-parity.ts
import { existsSync, readFileSync } from 'node:fs';

const redirected = [/^journal\/page\/\d+$/, /^journal\/archive\/\d{4}\/page\/\d+$/];
const urls = readFileSync(new URL('./mkdocs-urls.txt', import.meta.url), 'utf8').split('\n').filter(Boolean);
const dist = new URL('../dist/', import.meta.url);

const missing = urls.filter(
  (u) => !redirected.some((r) => r.test(u)) && !existsSync(new URL(`${u ? `${u}/` : ''}index.html`, dist)),
);
for (const u of missing) console.error(`MISSING /${u}/`);
console.log(`${urls.length} MkDocs URLs: ${missing.length ? `${missing.length} missing` : 'all served or redirected'}`);
process.exit(missing.length ? 1 : 0);
