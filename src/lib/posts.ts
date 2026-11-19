import { getCollection, type CollectionEntry } from 'astro:content';

export type Section = 'tech' | 'journal' | 'life';
export const SECTIONS: Section[] = ['tech', 'journal', 'life'];
export type Post = CollectionEntry<Section>;

// Future-dated posts are drafts, as in the MkDocs build.
export async function published(section: Section): Promise<Post[]> {
  const now = Date.now();
  const all = await getCollection(section);
  return all
    .filter((p: { data: { created: Date } }) => p.data.created.getTime() <= now)
    .sort((a: { data: { created: Date } }, b: { data: { created: Date } }) => b.data.created.getTime() - a.data.created.getTime());
}

export function href(section: Section, post: Post) {
  return `/${section}/${post.data.slug}/`;
}

// Reading time as a track length: CJK characters at ~400/min, Latin words at ~220/min.
export function trackSeconds(body = '') {
  const cjk = (body.match(/[぀-ヿ㐀-鿿]/g) ?? []).length;
  const words = (body.replace(/[぀-ヿ㐀-鿿]/g, ' ').match(/[A-Za-z0-9]+/g) ?? []).length;
  return Math.max(60, Math.round((cjk / 400 + words / 220) * 60));
}

export function formatSeconds(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function trackLength(body = '') {
  return formatSeconds(trackSeconds(body));
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

export const SERIES_DESCRIPTIONS: Record<string, string> = {
  'network': 'Comprehensive internet protocol architecture: from browser keystroke and NICs to Ethernet, BGP routing, and modern transport protocols.',
  'more-effective-cpp': 'Scott Meyers advanced C++ techniques: deep dive into exception safety, smart pointers, efficiency optimizations, and modern design patterns.',
  'k8s': 'Cloud-native production engineering: container runtimes, API Server scheduling, service mesh traffic shaping, and incident triage.',
  'effective-cpp': 'Modern C++ engineering discipline: 55 golden rules for improving software design and implementation.',
};

export interface SeriesShelfDef {
  id: string;
  title: string;
  subtitle: string;
  dirs: string[];
}

export const SERIES_SHELVES: SeriesShelfDef[] = [
  {
    id: 'systems',
    title: 'Systems & Networking',
    subtitle: 'Network protocols, from the browser to the wire',
    dirs: ['network'],
  },
  {
    id: 'languages',
    title: 'Languages & Runtimes',
    subtitle: 'Modern C++ engineering discipline',
    dirs: ['more-effective-cpp', 'effective-cpp'],
  },
  {
    id: 'data-cloud',
    title: 'Data & Cloud Infrastructure',
    subtitle: 'Kubernetes orchestration',
    dirs: ['k8s'],
  },
];

// Canonical album sequence derived from shelf order so DISC numbers run 01..N across shelves.
export const PINNED_SERIES: string[] = SERIES_SHELVES.flatMap((shelf) => shelf.dirs);

// Series ("albums"): chapters grouped by directory, in filename order.
export async function seriesAlbums() {
  const chapters = (await getCollection("series")).sort((a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id));
  const albums = new Map<string, typeof chapters>();
  for (const c of chapters) {
    const dir = c.id.split('/')[0];
    albums.set(dir, [...(albums.get(dir) ?? []), c]);
  }
  const order = (dir: string) => {
    const idx = PINNED_SERIES.indexOf(dir);
    return idx === -1 ? 999 : idx;
  };
  return [...albums]
    .sort(([a], [b]) => order(a) - order(b))
    .map(([dir, list], idx) => {
      const totalSeconds = list.reduce((sum: number, c: { body?: string }) => sum + trackSeconds(c.body), 0);
      return {
        dir,
        disc: idx + 1,
        // "K8S学习笔记 01 - 初见" -> "K8S学习笔记"
        name: list[0].data.title.replace(/\s*\d+\s*-.*$/, ''),
        description: SERIES_DESCRIPTIONS[dir] ?? list[0].data.description ?? '',
        totalLength: formatSeconds(totalSeconds),
        chapters: list,
      };
    });
}

export async function seriesShelves() {
  const allAlbums = await seriesAlbums();
  const byDir = new Map(allAlbums.map((a) => [a.dir, a]));
  const assigned = new Set<string>();

  const shelves = SERIES_SHELVES.map((shelf) => {
    const albums = shelf.dirs
      .map((d) => {
        assigned.add(d);
        return byDir.get(d);
      })
      .filter((a): a is NonNullable<typeof a> => Boolean(a));
    return { ...shelf, albums };
  }).filter((s) => s.albums.length > 0);

  const unassigned = allAlbums.filter((a) => !assigned.has(a.dir));
  if (unassigned.length > 0) {
    shelves.push({
      id: 'more',
      title: 'More Series',
      subtitle: 'Additional tutorial albums',
      dirs: unassigned.map((a) => a.dir),
      albums: unassigned,
    });
  }
  return shelves;
}

export function albumHref(dir: string) {
  return `/tech/series/${dir}/`;
}

type SeriesChapter = { id: string; data: { slug?: string } };

// URL segment of a chapter: frontmatter `slug` when set, else the filename.
// The filename (NN.name) still sets the order, so a chapter can move without its URL changing.
export function chapterSlug(c: SeriesChapter) {
  return c.data.slug ?? c.id.split('/')[1];
}

export function seriesHref(c: SeriesChapter) {
  return `/tech/series/${c.id.split('/')[0]}/${chapterSlug(c)}/`;
}

// Everything the /tags/ pages list: published posts in every section, plus series chapters.
export interface TaggedTrack {
  tags: string[];
  title: string;
  href: string;
  label: string;
  created: Date;
  description?: string;
  body?: string;
  lang: string;
}

export async function taggedTracks(): Promise<TaggedTrack[]> {
  const names: Record<Section, string> = { tech: 'Tech', journal: 'Journal', life: 'Life' };
  const tracks: TaggedTrack[] = [];
  for (const section of SECTIONS) {
    for (const p of await published(section)) {
      tracks.push({ tags: p.data.tags ?? [], title: p.data.title, href: href(section, p), label: names[section], created: p.data.created, description: p.data.description, body: p.body, lang: postLang(p) });
    }
  }
  for (const c of await getCollection('series')) {
    tracks.push({ tags: c.data.tags ?? [], title: c.data.title, href: seriesHref(c), label: 'Series', created: c.data.created, description: c.data.description, body: c.body, lang: textLang(c.body ?? '') });
  }
  return tracks;
}
