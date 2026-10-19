import { automaticItemColumnSequence as __doeFn_automaticItemColumnSequence } from '../automatic-item-column-sequence/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:4691
import { scope as __doeScope } from "../../runtime/context/index.js";

export function automaticItemColumnCandidates(
    state,
    limit = __doeScope.SOLVER_LIMITS.itemColumnCandidates,
  ) {
    const records = state.leafRecords
      .map((record) => ({
        id: record.node.id,
        sequence: (0, __doeFn_automaticItemColumnSequence)(record.node, record.definition),
      }))
      .filter((record) => record.sequence.length > 0);
    if (!records.length) return [{ columns: new Map(), steps: 0 }];

    const queue = [Array(records.length).fill(0)];
    const seen = new Set();
    const candidates = [];
    while (queue.length && candidates.length < limit) {
      const indexes = queue.shift();
      const key = indexes.join(":");
      if (seen.has(key)) continue;
      seen.add(key);
      candidates.push({
        columns: new Map(
          records.map((record, index) => [
            record.id,
            record.sequence[indexes[index]],
          ]),
        ),
        steps: indexes.reduce((sum, index) => sum + index, 0),
      });
      records.forEach((record, index) => {
        if (indexes[index] + 1 >= record.sequence.length) return;
        const next = [...indexes];
        next[index] += 1;
        queue.push(next);
      });
    }
    // Coordinate by preference rank, not by a shared numeric column count:
    // full-width final rows and equal-width final rows have different orders.
    const synchronized = Array.from(
      { length: Math.max(...records.map(record => record.sequence.length)) - 1 },
      (_, index) => {
        const ranks = records.map(record => Math.min(index + 1, record.sequence.length - 1));
        return {
          columns: new Map(records.map((record, i) => [record.id, record.sequence[ranks[i]]])),
          steps: ranks.reduce((sum, rank) => sum + rank, 0),
        };
      },
    );
    const keys = new Set();
    return [candidates[0], ...synchronized, ...candidates.slice(1)].filter(candidate => {
      const key = JSON.stringify([...candidate.columns]);
      if (keys.has(key)) return false; keys.add(key); return true;
    }).slice(0, limit);
  }
