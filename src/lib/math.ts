// Math, rendered at build time with KaTeX (no client JavaScript). Posts write
// TeX as $…$ / $$…$$; a paragraph holding a single formula is displayed as a
// centered block, as the MkDocs site did.
import { defineMdastPlugin } from 'satteri';
import katex from 'katex';

const render = (tex: string, displayMode: boolean) =>
  katex.renderToString(tex, { displayMode, throwOnError: false, output: 'htmlAndMathml' });
const block = (tex: string) => ({ type: 'html', value: `<div class="math-display">${render(tex, true)}</div>` });

// Formulas already rendered as part of a display paragraph, keyed by source
// offset (visitors receive separate node handles, so identity does not hold).
// The paragraph is visited before its formula; the inline visitor consumes
// the key, so it never lingers to match a formula in another document.
const taken = new Set<number | undefined>();
const key = (node: { position?: { start: { offset?: number } } }) => node.position?.start.offset;

export const math = defineMdastPlugin({
  name: 'katex-math',
  options: { position: true },
  paragraph(node: any, ctx: any) {
    const [only] = node.children;
    if (node.children.length !== 1 || only.type !== 'inlineMath') return;
    taken.add(key(only));
    ctx.replaceNode(node, block(only.value));
  },
  inlineMath(node: any, ctx: any) {
    if (taken.delete(key(node))) return;
    ctx.replaceNode(node, { type: 'html', value: render(node.value, false) });
  },
  math(node: any, ctx: any) {
    ctx.replaceNode(node, block(node.value));
  },
});
