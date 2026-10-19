import { lexicalInfo as __doeFn_lexicalInfo } from '../lexical-info/index.js';
import { nextNonWhitespace as __doeFn_nextNonWhitespace } from '../next-non-whitespace/index.js';
import { candidate as __doeFn_candidate } from '../candidate/index.js';
// Origin: public/yrkie-doe/core/schema-json-recovery.js:438


export function unquotedValueCandidates(text) {
    const { outside } = (0, __doeFn_lexicalInfo)(text);
    const candidates = [];
    for (let colon = 0; colon < text.length; colon += 1) {
      if (!outside[colon] || text[colon] !== ":") continue;
      const start = (0, __doeFn_nextNonWhitespace)(text, colon + 1);
      if (start === -1 || !outside[start] || '"{['.includes(text[start])) continue;
      let end = start;
      while (end < text.length && outside[end] && !/[,}\]\n\r]/.test(text[end])) end += 1;
      const raw = text.slice(start, end).trim();
      if (!raw || /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)$/.test(raw)) {
        continue;
      }
      if (/^(?:True|False|None)$/.test(raw)) continue;
      const rawEnd = start + raw.length;
      candidates.push(
        (0, __doeFn_candidate)(
          "quote-bare-string-value",
          text,
          start,
          rawEnd - start,
          JSON.stringify(raw),
          raw,
          JSON.stringify(raw),
          5,
        ),
      );
    }
    return candidates;
  }
