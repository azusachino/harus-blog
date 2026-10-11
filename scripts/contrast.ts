// WCAG AA (4.5:1) check for every palette in both modes, read straight from
// src/styles/global.css so the palette values exist in one place only.
// Usage: bun scripts/contrast.ts  (exits 1 on any failing pair)
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');
const blocks = new Map<string, Record<string, string>>();
for (const [, selector, body] of css.matchAll(/(:root[^{,]*)\{([^}]*)\}/g)) {
  const vars: Record<string, string> = {};
  for (const [, name, value] of body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) vars[name] = value.toLowerCase();
  blocks.set(selector.trim(), { ...blocks.get(selector.trim()), ...vars });
}

const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const palettes = ['teal', ...[...blocks.keys()].flatMap((s) => /^:root\[data-palette="([\w-]+)"\]$/.exec(s)?.[1] ?? [])];
const root = blocks.get(':root') ?? {};
const dark = blocks.get(':root[data-theme="dark"]') ?? {};
let failures = 0;

for (const p of palettes) {
  const light = { ...root, ...blocks.get(`:root[data-palette="${p}"]`) };
  const night = { ...root, ...dark, ...blocks.get(`:root[data-palette="${p}"]`), ...blocks.get(`:root[data-theme="dark"][data-palette="${p}"]`) };
  for (const [mode, t] of [['light', light], ['dark', night]] as const) {
    const pairs: [string, string, string][] = [
      ['ink', 'bg', 'body text'], ['ink', 'surface', 'card text'],
      ['muted', 'bg', 'meta text'], ['muted', 'surface', 'card meta'],
      ['primary', 'bg', 'links'], ['primary', 'surface', 'card links'],
      ['accent', 'bg', 'badges'], ['accent', 'surface', 'card badges'],
      ['on-accent', 'accent', 'badge label'],
      // Footer band: ink on glow in light mode, glow on surface in dark.
      mode === 'light' ? ['on-glow', 'glow', 'footer'] : ['glow', 'surface', 'footer'],
    ];
    // The "ID" mark and favicon always use --on-glow ink on --glow, in both modes.
    pairs.push(['on-glow', 'glow', 'ID mark']);
    // Graphics need 3:1 (WCAG 1.4.11): lit piano keys against unlit white keys.
    const graphics: [string, string, string][] = [['accent', 'key-white', 'lit piano key']];
    for (const [list, min] of [[pairs, 4.5], [graphics, 3]] as const) {
      for (const [fg, bg, use] of list) {
        const r = ratio(t[fg], t[bg]);
        if (r < min) {
          failures++;
          console.error(`FAIL ${p}/${mode}: ${use} --${fg} ${t[fg]} on --${bg} ${t[bg]} = ${r.toFixed(2)} (< ${min})`);
        }
      }
    }
  }
}

console.log(`${palettes.length} palettes x 2 modes: ${failures ? `${failures} failing pairs` : 'all AA'}`);
process.exit(failures ? 1 : 0);
