import { lexicalInfo as __doeFn_lexicalInfo } from '../lexical-info/index.js';
import { candidate as __doeFn_candidate } from '../candidate/index.js';
// Origin: public/yrkie-doe/core/schema-json-recovery.js:338


export function singleQuotedStringCandidates(text) {
    const { outside } = (0, __doeFn_lexicalInfo)(text);
    const candidates = [];
    for (let start = 0; start < text.length; start += 1) {
      if (!outside[start] || text[start] !== "'") continue;
      let escaped = false;
      for (let end = start + 1; end < text.length; end += 1) {
        if (escaped) {
          escaped = false;
          continue;
        }
        if (text[end] === "\\") {
          escaped = true;
          continue;
        }
        if (text[end] !== "'") continue;
        const content = text.slice(start + 1, end).replace(/\\'/g, "'");
        const quoted = JSON.stringify(content);
        candidates.push(
          (0, __doeFn_candidate)(
            "convert-single-quoted-string",
            text,
            start,
            end - start + 1,
            quoted,
            text.slice(start, end + 1),
            quoted,
            3,
          ),
        );
        start = end;
        break;
      }
    }
    return candidates;
  }
