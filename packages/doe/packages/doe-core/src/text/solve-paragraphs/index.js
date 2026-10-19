import { solveLines as __doeFn_solveLines } from '../solve-lines/index.js';
// Origin: public/yrkie-doe/core/semantic-text-layout.js:262


export function solveParagraphs(paragraphs, widthPx, maxLines, measure, sources = []) {
    const nonempty = paragraphs.length ? paragraphs : [[]];
    const lines = [];
    let cost = 0;
    const ranges = [];
    let offset = 0;
    for (let index = 0; index < nonempty.length; index += 1) {
      const remainingParagraphs = nonempty.length - index - 1;
      const remainingLines = maxLines - lines.length - remainingParagraphs;
      if (remainingLines < 1) return null;
      const solved = (0, __doeFn_solveLines)(nonempty[index], widthPx, remainingLines, measure);
      if (!solved) return null;
      lines.push(...solved.lines);
      ranges.push(...solved.ranges.map(range => ({ start: offset + range.start, end: offset + range.end })));
      offset += (sources[index] || "").length + 1;
      cost += solved.cost;
    }
    return { lines, ranges, cost };
  }
