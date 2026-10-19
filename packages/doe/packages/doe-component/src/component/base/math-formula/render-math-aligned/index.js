import { renderMathTable as __doeFn_renderMathTable } from '../render-math-table/index.js';
// Origin: public/yrkie-doe/components/math-formula/math-formula.js:1006


export function renderMathAligned(node, options) {
    const columnCount = Math.max(1, node.columns);
    const alignments = Array.from({ length: columnCount }, (_, index) => index % 2 === 0 ? "right" : "left").join(" ");
    return (0, __doeFn_renderMathTable)(node.rows, columnCount, options, {
      columnalign: alignments,
      columnspacing: "0.45em",
      rowspacing: "0.35em",
    });
  }
