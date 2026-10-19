import { mathEl as __doeFn_mathEl } from '../math-el/index.js';
import { renderMathRow as __doeFn_renderMathRow } from '../render-math-row/index.js';
// Origin: public/yrkie-doe/components/math-formula/math-formula.js:794


export function renderAst(ast, options) {
    const settings = options || {};
    const display = settings.display === true;
    const root = (0, __doeFn_mathEl)("math", null, {
      display: display ? "block" : "inline",
      mathvariant: "normal",
    });
    root.classList.add("ppt-math-formula__root");
    root.dataset.display = String(display);
    root.append((0, __doeFn_renderMathRow)(ast.children, { display }));
    return root;
  }
