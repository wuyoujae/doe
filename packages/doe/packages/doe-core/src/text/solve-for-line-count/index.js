import { lineText as __doeFn_lineText } from '../line-text/index.js';
import { boundaryPenalty as __doeFn_boundaryPenalty } from '../boundary-penalty/index.js';
// Origin: public/yrkie-doe/core/semantic-text-layout.js:198


export function solveForLineCount(tokens, widthPx, lineCount, measure) {
    const memo = new Map();
    const count = tokens.length;

    function visit(start, remaining) {
      const key = `${start}:${remaining}`;
      if (memo.has(key)) return memo.get(key);
      if (remaining === 0) {
        return start === count ? { cost: 0, lines: [], ranges: [] } : null;
      }
      if (count - start < remaining) return null;

      let best = null;
      const lastPossibleEnd = count - remaining + 1;
      for (let end = start + 1; end <= lastPossibleEnd; end += 1) {
        const current = (0, __doeFn_lineText)(tokens, start, end);
        const measured = measure(current);
        if (measured > widthPx + 0.25) break;
        const nextPreview =
          end < count ? (0, __doeFn_lineText)(tokens, end, Math.min(count, end + 2)) : "";
        const rest = visit(end, remaining - 1);
        if (!rest) continue;

        const unusedRatio = Math.max(0, widthPx - measured) / Math.max(1, widthPx);
        const raggedness =
          unusedRatio * unusedRatio * (remaining === 1 ? 180 : 1000);
        const candidate = {
          cost: raggedness + (0, __doeFn_boundaryPenalty)(current, nextPreview) + rest.cost,
          lines: [current, ...rest.lines],
          ranges: [{ start: start === 0 ? 0 : tokens[start].start,
            end: tokens[end - 1].end + (end === count ? (tokens[end - 1].trailing || "").length : 0) }, ...rest.ranges],
        };
        if (!best || candidate.cost < best.cost) best = candidate;
      }
      memo.set(key, best);
      return best;
    }

    return visit(0, lineCount);
  }
