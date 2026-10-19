import { lexicalInfo as __doeFn_lexicalInfo } from '../lexical-info/index.js';
import { nextNonWhitespace as __doeFn_nextNonWhitespace } from '../next-non-whitespace/index.js';
import { candidate as __doeFn_candidate } from '../candidate/index.js';
// Origin: public/yrkie-doe/core/schema-json-recovery.js:375


export function bareKeyCandidates(text) {
    const { outside } = (0, __doeFn_lexicalInfo)(text);
    const candidates = [];
    for (let separator = 0; separator < text.length; separator += 1) {
      if (!outside[separator] || (text[separator] !== "{" && text[separator] !== ",")) continue;
      const start = (0, __doeFn_nextNonWhitespace)(text, separator + 1);
      if (start === -1 || !outside[start] || '"}]'.includes(text[start])) continue;
      let end = start;
      while (end < text.length && outside[end] && !/[\s:,{}[\]]/.test(text[end])) end += 1;
      if (end === start) continue;
      const colon = (0, __doeFn_nextNonWhitespace)(text, end);
      if (colon === -1 || text[colon] !== ":") continue;
      const key = text.slice(start, end);
      candidates.push(
        (0, __doeFn_candidate)(
          "quote-bare-property-name",
          text,
          start,
          end - start,
          JSON.stringify(key),
          key,
          JSON.stringify(key),
          3,
        ),
      );
    }
    return candidates;
  }
