import { getCollection } from 'astro:content';
import { day, href, published, SECTIONS } from '../lib/posts';

export async function GET() {
  const items: Array<{
    title: string;
    url: string;
    section: string;
    date?: string;
    tags?: string[];
    desc?: string;
  }> = [];

  for (const section of SECTIONS) {
    const posts = await published(section);
    for (const p of posts) {
      items.push({
        title: p.data.title,
        url: href(section, p),
        section,
        date: day(p.data.created),
        tags: [...p.data.categories, ...(p.data.tags ?? [])],
        desc: p.data.description,
      });
    }
  }

  const allSeries = await getCollection('series');
  for (const chapter of allSeries) {
    const [album, chap] = chapter.id.split('/');
    if (album && chap) {
      items.push({
        title: chapter.data.title,
        url: `/tech/series/${album}/${chap}/`,
        section: 'series',
        date: chapter.data.created ? day(chapter.data.created) : undefined,
        desc: chapter.data.description,
      });
    }
  }

  const trips = await getCollection('trips');
  for (const t of trips) {
    items.push({
      title: t.data.properties.title,
      url: `/travel/${t.data.properties.slug}/`,
      section: 'travel',
      desc: t.data.properties.summary,
    });
  }

  return new Response(JSON.stringify(items), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
