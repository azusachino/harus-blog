import { getCollection, type CollectionEntry } from 'astro:content';

export type Section = 'tech' | 'journal' | 'life';
export const SECTIONS: Section[] = ['tech', 'journal', 'life'];
export type Post = CollectionEntry<Section>;

// Future-dated posts are drafts, as in the MkDocs build.
export async function published(section: Section): Promise<Post[]> {
  const now = Date.now();
  const all = await getCollection(section);
  return all
    .filter((p) => p.data.date.getTime() <= now)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function href(section: Section, post: Post) {
  return `/${section}/${post.data.slug}/`;
}

// Reading time as a track length: CJK characters at ~400/min, Latin words at ~220/min.
export function trackLength(body = '') {
  const cjk = (body.match(/[぀-ヿ㐀-鿿]/g) ?? []).length;
  const words = (body.replace(/[぀-ヿ㐀-鿿]/g, ' ').match(/[A-Za-z0-9]+/g) ?? []).length;
  const seconds = Math.max(60, Math.round((cjk / 400 + words / 220) * 60));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function day(date: Date) {
  return date.toISOString().slice(0, 10);
}

// Article language for the `lang` attribute: frontmatter `lang` wins,
// otherwise guess from the body: more kana than Han -> ja (Chinese posts
// quoting Japanese lyrics stay zh-CN), mostly Han -> zh-CN.
export function postLang(post: Post) {
  return post.data.lang ?? textLang(post.body ?? '');
}

export function textLang(body: string) {
  const kana = (body.match(/[぀-ヿ]/g) ?? []).length;
  const han = (body.match(/[㐀-鿿]/g) ?? []).length;
  const words = (body.match(/[A-Za-z]+/g) ?? []).length;
  if (kana > 20 && kana > han) return 'ja';
  if (han > words) return 'zh-CN';
  return 'en';
}
