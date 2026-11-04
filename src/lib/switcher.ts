// Pure matching for the quick switcher's Documents and Full text groups,
// adapted from Apricot (vendor/apricot/site/src/lib/switcher.ts) and kept free of browser APIs.
import type { SwitcherNote } from '../types/pagefind';

export const DOCUMENT_LIMIT = 8;

// Strict, substring-based matching: every whitespace-separated query word must occur,
// case-insensitively, in the title, tags, description, or URL.
// Ranking:
//  0: title starts with the whole query phrase
//  1: title contains all words
//  2: tags, description or URL supply matches
// Equal ranks maintain the original document catalog order.
// An empty query returns the first `limit` notes in catalog order.
export function matchDocuments<T extends SwitcherNote>(
  notes: readonly T[],
  query: string,
  limit = DOCUMENT_LIMIT
): T[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [...notes].slice(0, limit);

  const phrase = words.join(' ');
  const ranked: Array<{ note: T; rank: number }> = [];

  for (const note of notes) {
    const title = note.title.toLowerCase();
    const tags = (note.tags ?? []).map((t) => t.toLowerCase());
    const desc = (note.desc ?? '').toLowerCase();
    const url = note.url.toLowerCase();

    const matchesWord = (w: string) =>
      title.includes(w) ||
      tags.some((t) => t.includes(w)) ||
      desc.includes(w) ||
      url.includes(w);

    if (!words.every(matchesWord)) continue;

    const inTitle = words.every((w) => title.includes(w));
    const rank = title.startsWith(phrase) ? 0 : inTitle ? 1 : 2;
    ranked.push({ note, rank });
  }

  return ranked
    .sort((a, b) => a.rank - b.rank)
    .slice(0, limit)
    .map(({ note }) => note);
}

// Full text rows are the Pagefind hits minus any note already listed under Documents.
export function withoutShown<T extends { url: string }>(
  hits: readonly T[],
  shownUrls: ReadonlySet<string>
): T[] {
  return hits.filter((hit) => !shownUrls.has(hit.url));
}
