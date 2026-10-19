import { candidate as __doeFn_candidate } from '../candidate/index.js';
// Origin: public/yrkie-doe/core/schema-json-recovery.js:222


export function wholeDocumentCandidate(kind, text, repairedText, index, descriptionParts, priority) {
    const result = (0, __doeFn_candidate)(
      kind,
      text,
      0,
      text.length,
      repairedText,
      descriptionParts.before,
      descriptionParts.after,
      priority,
    );
    result.index = index;
    return result;
  }
