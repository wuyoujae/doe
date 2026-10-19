import { lexicalInfo as __doeFn_lexicalInfo } from '../lexical-info/index.js';
import { wholeDocumentCandidate as __doeFn_wholeDocumentCandidate } from '../whole-document-candidate/index.js';
// Origin: public/yrkie-doe/core/schema-json-recovery.js:266


export function smartQuoteCandidate(text) {
    const { outside } = (0, __doeFn_lexicalInfo)(text);
    const replacements = { "“": '"', "”": '"', "‘": "'", "’": "'" };
    let changed = false;
    const repaired = [...text]
      .map((character, index) => {
        if (!outside[index] || !replacements[character]) return character;
        changed = true;
        return replacements[character];
      })
      .join("");
    return changed
      ? (0, __doeFn_wholeDocumentCandidate)(
          "normalize-smart-quotes",
          text,
          repaired,
          0,
          { before: "弯引号", after: "JSON 引号" },
          2,
        )
      : null;
  }
