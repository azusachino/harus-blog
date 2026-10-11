// Math, rendered at build time with KaTeX (no client JavaScript). Posts write
// TeX as $…$ / $$…$$; a paragraph holding a single formula is displayed as a
// centered block, as the MkDocs site did.
import { defineMdastPlugin } from 'satteri';
import katex from 'katex';

const render = (tex, displayMode) =>
  katex.renderToString(tex, { displayMode, throwOnError: false, output: 'htmlAndMathml' });
const block = (tex) => ({ type: 'html', value: `<div class="math-display">${render(tex, true)}</div>` });

export const math = defineMdastPlugin({
  name: 'katex-math',
  paragraph(node, ctx) {
    const [only] = node.children;
    if (node.children.length === 1 && only.type === 'inlineMath') ctx.replaceNode(node, block(only.value));
  },
  inlineMath(node, ctx) {
    ctx.replaceNode(node, { type: 'html', value: render(node.value, false) });
  },
  math(node, ctx) {
    ctx.replaceNode(node, block(node.value));
  },
});
