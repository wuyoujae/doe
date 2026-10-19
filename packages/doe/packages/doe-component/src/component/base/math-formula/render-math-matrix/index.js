import { renderMathTable as __doeFn_renderMathTable } from '../render-math-table/index.js';
import { mathEl as __doeFn_mathEl } from '../math-el/index.js';
// Origin: public/yrkie-doe/components/math-formula/math-formula.js:985


export function renderMathMatrix(node, options) {
    const columnCount = Math.max(1, node.columns, ...node.rows.map((row) => row.length));
    const table = (0, __doeFn_renderMathTable)(node.rows, columnCount, options, {
      columnspacing: "0.9em",
      rowspacing: "0.35em",
    });
    const row = (0, __doeFn_mathEl)("mrow");
    const delimiters = {
      pmatrix: ["(", ")"],
      bmatrix: ["[", "]"],
      vmatrix: ["|", "|"],
      Vmatrix: ["‖", "‖"],
      cases: ["{", null],
    };
    const pair = delimiters[node.env];
    if (pair?.[0]) row.append((0, __doeFn_mathEl)("mo", pair[0], { stretchy: "true", fence: "true" }));
    row.append(table);
    if (pair?.[1]) row.append((0, __doeFn_mathEl)("mo", pair[1], { stretchy: "true", fence: "true" }));
    return row;
  }
