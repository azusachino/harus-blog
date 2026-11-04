// Pure helpers for Pagefind results, adapted from Apricot (vendor/apricot/site/src/lib/fulltext.ts).
export interface ExcerptPart {
  text: string;
  mark: boolean;
}

const MARK_OPEN = '\u0001';
const MARK_CLOSE = '\u0002';
const entities: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x27;': "'",
};

// Pagefind escapes page text and marks matches with <mark>. Only those marks are kept as markup;
// every other tag is dropped and escaped entities are decoded once.
export function excerptParts(html: string): ExcerptPart[] {
  const parts: ExcerptPart[] = [];
  let mark = false;
  const plain = html
    .replace(/<mark>/g, MARK_OPEN)
    .replace(/<\/mark>/g, MARK_CLOSE)
    .replace(/<[^>]*>/g, '');

  for (const piece of plain.split(/([\u0001\u0002])/)) {
    if (piece === MARK_OPEN) {
      mark = true;
    } else if (piece === MARK_CLOSE) {
      mark = false;
    } else if (piece) {
      parts.push({
        text: piece.replace(/&(amp|lt|gt|quot|#39|#x27);/g, (entity) => entities[entity] ?? entity),
        mark,
      });
    }
  }
  return parts;
}

// Normalizes Pagefind reported URLs (/tech/posts/inside-kafka/index.html -> /tech/posts/inside-kafka/).
export function routeOf(url: string): string {
  const cleaned = url.replace(/\.html$/, '').replace(/\/index$/, '/').replace(/(.)\/$/, '$1');
  return cleaned ? (cleaned.endsWith('/') ? cleaned : `${cleaned}/`) : '/';
}
