import { replaceRange as __doeFn_replaceRange } from '../replace-range/index.js';
// Origin: public/yrkie-doe/core/schema-json-recovery.js:209


export function candidate(kind, text, index, removeCount, insert, before, after, priority) {
    return {
      kind,
      text: (0, __doeFn_replaceRange)(text, index, removeCount, insert),
      index,
      removeCount,
      insert,
      before,
      after,
      priority,
    };
  }
