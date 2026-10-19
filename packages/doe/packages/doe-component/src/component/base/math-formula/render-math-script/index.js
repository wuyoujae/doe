import { renderMathNode as __doeFn_renderMathNode } from '../render-math-node/index.js';
import { emptyMathBase as __doeFn_emptyMathBase } from '../empty-math-base/index.js';
import { mathEl as __doeFn_mathEl } from '../math-el/index.js';
// Origin: public/yrkie-doe/components/math-formula/math-formula.js:924


export function renderMathScript(node, options, baseOverride) {
    const base = baseOverride || (node.base ? (0, __doeFn_renderMathNode)(node.base, options) : (0, __doeFn_emptyMathBase)());
    if (node.sup && node.sub) {
      const wrap = (0, __doeFn_mathEl)("msubsup");
      wrap.append(base, (0, __doeFn_renderMathNode)(node.sub, options) || (0, __doeFn_emptyMathBase)(), (0, __doeFn_renderMathNode)(node.sup, options) || (0, __doeFn_emptyMathBase)());
      return wrap;
    }
    if (node.sup) {
      const wrap = (0, __doeFn_mathEl)("msup");
      wrap.append(base, (0, __doeFn_renderMathNode)(node.sup, options) || (0, __doeFn_emptyMathBase)());
      return wrap;
    }
    if (node.sub) {
      const wrap = (0, __doeFn_mathEl)("msub");
      wrap.append(base, (0, __doeFn_renderMathNode)(node.sub, options) || (0, __doeFn_emptyMathBase)());
      return wrap;
    }
    return base;
  }
