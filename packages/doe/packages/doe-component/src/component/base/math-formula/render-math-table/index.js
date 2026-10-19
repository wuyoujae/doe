import { mathEl as __doeFn_mathEl } from '../math-el/index.js';
import { renderMathNode as __doeFn_renderMathNode } from '../render-math-node/index.js';
import { emptyMathBase as __doeFn_emptyMathBase } from '../empty-math-base/index.js';
// Origin: public/yrkie-doe/components/math-formula/math-formula.js:971


export function renderMathTable(rows, columnCount, options, attrs) {
    const table = (0, __doeFn_mathEl)("mtable", null, attrs);
    (rows || []).forEach((row) => {
      const tableRow = (0, __doeFn_mathEl)("mtr");
      for (let c = 0; c < columnCount; c += 1) {
        const cell = (0, __doeFn_mathEl)("mtd");
        cell.append(row[c] ? (0, __doeFn_renderMathNode)(row[c], options) : (0, __doeFn_emptyMathBase)());
        tableRow.append(cell);
      }
      table.append(tableRow);
    });
    return table;
  }
