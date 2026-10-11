import { SITE } from '../lib/site';
import { href, published, SECTIONS } from '../lib/posts';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// RSS 2.0 of the latest posts across all sections. Plain string building:
// the format is small and stable enough not to need a dependency.
export async function GET() {
  const all = (await Promise.all(SECTIONS.map(async (s) => (await published(s)).map((post) => ({ s, post })))))
    .flat()
    .sort((a, b) => b.post.data.date.getTime() - a.post.data.date.getTime())
    .slice(0, 30);
  const items = all
    .map(({ s, post }) => {
      const link = new URL(href(s, post), SITE.url).href;
      return `    <item>
      <title>${esc(post.data.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${post.data.date.toUTCString()}</pubDate>
      <category>${s}</category>
      <description>${esc(post.data.description)}</description>
    </item>`;
    })
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE.title)}</title>
    <link>${SITE.url}/</link>
    <atom:link href="${SITE.url}/rss.xml" rel="self" type="application/rss+xml"/>
    <description>${esc(SITE.description)}</description>
    <language>en</language>
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
