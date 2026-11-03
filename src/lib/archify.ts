import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineMdastPlugin } from 'satteri';

const BLOG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DOCS_ROOT = join(BLOG_ROOT, 'docs');
const OPEN_OR_SELF_REGEX =
  /<Archify\s+src=["']([^"']+)["'](?:\s+height=["']?(\d+)["']?)?\s*(?:\/>|><\/Archify>|>)/i;
const CLOSE_REGEX = /<\/Archify>/i;

const SOURCE_SUFFIX =
  /\.(architecture|workflow|sequence|dataflow|lifecycle|erd|class|tree|timeline|waterfall)\.json$/;

function renderEmbed(rawSrc: string, heightStr: string | undefined, fileURL: URL | undefined): string {
  let htmlPath: string;
  if (rawSrc.startsWith('/')) {
    htmlPath = rawSrc.replace(/\.json$/, '.html');
  } else if (fileURL) {
    const filePath = fileURLToPath(fileURL);
    const absPath = resolve(dirname(filePath), rawSrc);
    const rel = relative(DOCS_ROOT, absPath).split('\\').join('/');
    htmlPath = `/archify/${rel.replace(/\.json$/, '.html')}`;
  } else {
    htmlPath = rawSrc.replace(/\.json$/, '.html');
  }

  const height = heightStr ? parseInt(heightStr, 10) : 480;
  const name = basename(rawSrc).replace(SOURCE_SUFFIX, '');
  const title = name ? `Diagram · ${name}` : 'Archify diagram';

  return `<figure class="archify archify-embed"><iframe src="${htmlPath}?theme=light&embed=1" data-archify="${htmlPath}" data-embed="true" title="${title}" loading="lazy" style="height:${height}px"></iframe><a class="archify-expand" href="${htmlPath}" target="_blank" rel="noopener noreferrer" aria-label="Expand diagram" title="Open full diagram">⤢</a></figure>`;
}

const taken = new Set<number | undefined>();
const key = (node: { position?: { start?: { offset?: number } } }) => node.position?.start?.offset;

export const archify = defineMdastPlugin({
  name: 'archify-embed',
  options: { position: true },
  paragraph(node: any, ctx: any) {
    const text = node.children.map((c: any) => c.value ?? '').join('');
    const match = OPEN_OR_SELF_REGEX.exec(text);
    if (!match) return;

    for (const child of node.children) {
      taken.add(key(child));
    }
    const html = renderEmbed(match[1], match[2], ctx.fileURL);
    ctx.replaceNode(node, { type: 'html', value: html });
  },
  html(node: any, ctx: any) {
    if (taken.delete(key(node))) return;

    if (CLOSE_REGEX.test(node.value)) {
      ctx.replaceNode(node, { type: 'html', value: '' });
      return;
    }

    const match = OPEN_OR_SELF_REGEX.exec(node.value);
    if (!match) return;

    const html = renderEmbed(match[1], match[2], ctx.fileURL);
    ctx.replaceNode(node, { type: 'html', value: html });
  },
});
