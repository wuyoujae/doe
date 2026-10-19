import { lexicalInfo as __doeFn_lexicalInfo } from '../lexical-info/index.js';
import { nextNonWhitespace as __doeFn_nextNonWhitespace } from '../next-non-whitespace/index.js';
import { candidate as __doeFn_candidate } from '../candidate/index.js';
// Origin: public/yrkie-doe/core/schema-json-recovery.js:404


export function bareKeyMissingColonCandidates(text) {
    const { outside } = (0, __doeFn_lexicalInfo)(text);
    const candidates = [];
    for (let separator = 0; separator < text.length; separator += 1) {
      if (!outside[separator] || (text[separator] !== "{" && text[separator] !== ",")) continue;
      const start = (0, __doeFn_nextNonWhitespace)(text, separator + 1);
      if (start === -1 || !outside[start] || !/[A-Za-z_$]/.test(text[start])) continue;
      let end = start + 1;
      while (end < text.length && outside[end] && /[\w$-]/.test(text[end])) end += 1;
      const valueStart = (0, __doeFn_nextNonWhitespace)(text, end);
      if (
        valueStart === -1 ||
        text[valueStart] === ":" ||
        !/["'{[\d\-tfn]/.test(text[valueStart])
      ) {
        continue;
      }
      const key = text.slice(start, end);
      candidates.push(
        (0, __doeFn_candidate)(
          "quote-bare-property-and-insert-colon",
          text,
          start,
          end - start,
          `${JSON.stringify(key)}:`,
          key,
          `${JSON.stringify(key)}:`,
          2,
        ),
      );
    }
    return candidates;
  }
