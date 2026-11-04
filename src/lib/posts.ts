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

// Pinned order for tutorial series albums, latest series first (descending).
export const PINNED_SERIES: string[] = [
  'flink',
  'math-for-ai',
  'aws-sap',
  'llm-from-scratch',
  'network',
  'more-effective-cpp',
  'k8s',
  'effective-cpp',
];

export const SERIES_DESCRIPTIONS: Record<string, string> = {
  'flink': 'Stream processing architecture from core intuition to production runtime, backed by Apache Flink and runnable labs.',
  'math-for-ai': '从高维空间、矩阵变换机器、RoPE 旋转到损失山谷与离散采样的数学直觉。',
  'aws-sap': 'AWS 方案架构师专业级通关指南与企业级全球架构实战体系。',
  'llm-from-scratch': '深入大模型底层：从零手写分词器、注意力机制、Transformer 到训练采样。',
  'network': '从浏览器回车、硬件网卡、以太网到 BGP 路由与现代互联网协议全景。',
  'more-effective-cpp': 'Scott Meyers 经典进阶之作：深入异常安全、智能指针、效率优化与技术模式。',
  'k8s': '云原生生产落地笔记：深入容器运行时、API Server 调度、网格流量与生产排障。',
  'effective-cpp': '现代 C++ 程序员的修养：55 个改善设计与实现的黄金法则。',
};

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

export function albumHref(dir: string) {
  return `/tech/series/${dir}/`;
}

export function seriesHref(id: string) {
  return `/tech/series/${id}/`;
}
