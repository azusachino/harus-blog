// Posts mark their cover as `![alt](src){ .post-cover }` (a Python-Markdown
// attr_list). Replace that paragraph with a classed <img> instead of letting
// the marker render as text.
import { defineMdastPlugin } from 'satteri';

const MARK = /^\s*\{\s*\.post-cover\s*\}\s*$/;
// CommonMark rejects unencoded spaces in image URLs that Python-Markdown
// accepted, leaving the whole line as text.
const RAW = /^!\[([^\]]*)\]\(([^)]+)\)\s*\{\s*\.post-cover\s*\}\s*$/;
const esc = (s = '') => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const cover = (src, alt) => ({
  type: 'html',
  value: `<img class="post-cover" src="${esc(encodeURI(decodeURI(src)))}" alt="${esc(alt)}" loading="lazy">`,
});

export const postCover = defineMdastPlugin({
  name: 'post-cover',
  paragraph(node, ctx) {
    const [first, second] = node.children;
    if (node.children.length === 2 && first.type === 'image' && second.type === 'text' && MARK.test(second.value)) {
      ctx.replaceNode(node, cover(first.url, first.alt ?? ''));
    } else if (node.children.length === 1 && first.type === 'text') {
      const m = RAW.exec(first.value);
      if (m) ctx.replaceNode(node, cover(m[2].trim(), m[1]));
    }
  },
});
