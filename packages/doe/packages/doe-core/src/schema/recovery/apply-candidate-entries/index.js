import { replaceRange as __doeFn_replaceRange } from '../replace-range/index.js';
// Origin: public/yrkie-doe/core/schema-json-recovery.js:254


export function applyCandidateEntries(text, entries) {
    if (!Array.isArray(entries) || !entries.length) return text;
    return entries
      .slice()
      .sort((left, right) => right.index - left.index)
      .reduce(
        (repaired, entry) =>
          (0, __doeFn_replaceRange)(repaired, entry.index, entry.removeCount, entry.insert),
        text,
      );
  }
