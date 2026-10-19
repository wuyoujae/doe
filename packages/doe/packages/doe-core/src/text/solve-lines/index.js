import { lineText as __doeFn_lineText } from '../line-text/index.js';
import { solveForLineCount as __doeFn_solveForLineCount } from '../solve-for-line-count/index.js';
// Origin: public/yrkie-doe/core/semantic-text-layout.js:239


export function solveLines(tokens, widthPx, maxLines, measure) {
    if (!tokens.length) return { cost: 0, lines: [""], ranges: [{ start: 0, end: 0 }] };
    const widths = new Map();
    const measured = (text) => {
      if (!widths.has(text)) widths.set(text, measure(text));
      return widths.get(text);
    };
    // Greedy packing establishes the minimum feasible line count. The DP then
    // chooses phrase boundaries across the paragraph, reusing measured runs.
    let minimumLines = 0;
    for (let start = 0; start < tokens.length;) {
      let end = start;
      while (end < tokens.length && measured((0, __doeFn_lineText)(tokens, start, end + 1)) <= widthPx + 0.25) end++;
      if (end === start) return null;
      minimumLines++; start = end;
    }
    for (let lineCount = minimumLines; lineCount <= maxLines; lineCount += 1) {
      const result = (0, __doeFn_solveForLineCount)(tokens, widthPx, lineCount, measured);
      if (result) return result;
    }
    return null;
  }
