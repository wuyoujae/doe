import { replaceRange as __doeFn_replaceRange } from '../replace-range/index.js';
import { wholeDocumentCandidate as __doeFn_wholeDocumentCandidate } from '../whole-document-candidate/index.js';
// Origin: public/yrkie-doe/core/schema-json-recovery.js:237


export function combinedCandidate(kind, text, entries, priority, before, after) {
    if (!Array.isArray(entries) || entries.length < 2) return null;
    const ordered = entries.slice().sort((left, right) => right.index - left.index);
    let repaired = text;
    for (const entry of ordered) {
      repaired = (0, __doeFn_replaceRange)(repaired, entry.index, entry.removeCount, entry.insert);
    }
    return (0, __doeFn_wholeDocumentCandidate)(
      kind,
      text,
      repaired,
      Math.min(...entries.map((entry) => entry.index)),
      { before, after },
      priority,
    );
  }
