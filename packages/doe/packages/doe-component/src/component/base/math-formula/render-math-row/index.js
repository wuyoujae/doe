import { mathEl as __doeFn_mathEl } from '../math-el/index.js';
import { renderMathScript as __doeFn_renderMathScript } from '../render-math-script/index.js';
import { renderMathNode as __doeFn_renderMathNode } from '../render-math-node/index.js';
// Origin: public/yrkie-doe/components/math-formula/math-formula.js:807


export function renderMathRow(children, options) {
    const row = (0, __doeFn_mathEl)("mrow");
    (children || []).forEach((child) => {
      // A postfix script can follow a grouped delimiter in the token stream
      // (`\left(...\right)^2`). The legacy visual renderer used a zero-width
      // ghost for this case; MathML needs the actual preceding atom as base.
      let rendered;
      if (child?.kind === "script" && !child.base && row.lastElementChild) {
        const previous = row.lastElementChild;
        previous.remove();
        rendered = (0, __doeFn_renderMathScript)(child, options, previous);
      } else {
        rendered = (0, __doeFn_renderMathNode)(child, options);
      }
      if (rendered) row.append(rendered);
    });
    return row;
  }
