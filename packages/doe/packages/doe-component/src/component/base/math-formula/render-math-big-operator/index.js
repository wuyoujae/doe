import { mathEl as __doeFn_mathEl } from '../math-el/index.js';
import { renderMathNode as __doeFn_renderMathNode } from '../render-math-node/index.js';
import { emptyMathBase as __doeFn_emptyMathBase } from '../empty-math-base/index.js';
// Origin: public/yrkie-doe/components/math-formula/math-formula.js:944


export function renderMathBigOperator(node, options) {
    const display = options.display === true;
    const integral = node.char === "∫" || node.char === "∬" || node.char === "∭" || node.char === "∮";
    const base = (0, __doeFn_mathEl)("mo", node.char, {
      largeop: "true",
      movablelimits: "true",
      stretchy: integral ? "true" : "false",
    });
    const stacked = display && !integral;
    if (node.upper && node.lower) {
      const wrap = (0, __doeFn_mathEl)(stacked ? "munderover" : "msubsup");
      wrap.append(base, (0, __doeFn_renderMathNode)(node.lower, options) || (0, __doeFn_emptyMathBase)(), (0, __doeFn_renderMathNode)(node.upper, options) || (0, __doeFn_emptyMathBase)());
      return wrap;
    }
    if (node.upper) {
      const wrap = (0, __doeFn_mathEl)(stacked ? "mover" : "msup");
      wrap.append(base, (0, __doeFn_renderMathNode)(node.upper, options) || (0, __doeFn_emptyMathBase)());
      return wrap;
    }
    if (node.lower) {
      const wrap = (0, __doeFn_mathEl)(stacked ? "munder" : "msub");
      wrap.append(base, (0, __doeFn_renderMathNode)(node.lower, options) || (0, __doeFn_emptyMathBase)());
      return wrap;
    }
    return base;
  }
