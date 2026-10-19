import { wholeDocumentCandidate as __doeFn_wholeDocumentCandidate } from '../whole-document-candidate/index.js';
// Origin: public/yrkie-doe/core/schema-json-recovery.js:289


export function commentCandidate(text) {
    let repaired = "";
    let changed = false;
    let inString = false;
    let escaped = false;
    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      if (inString) {
        repaired += character;
        if (escaped) escaped = false;
        else if (character === "\\") escaped = true;
        else if (character === '"') inString = false;
        continue;
      }
      if (character === '"') {
        inString = true;
        repaired += character;
        continue;
      }
      if (character === "/" && text[index + 1] === "/") {
        changed = true;
        while (index < text.length && text[index] !== "\n") index += 1;
        if (index < text.length) repaired += "\n";
        continue;
      }
      if (character === "/" && text[index + 1] === "*") {
        changed = true;
        index += 2;
        while (index < text.length && !(text[index] === "*" && text[index + 1] === "/")) {
          if (text[index] === "\n") repaired += "\n";
          index += 1;
        }
        index += 1;
        continue;
      }
      repaired += character;
    }
    return changed
      ? (0, __doeFn_wholeDocumentCandidate)(
          "remove-comments",
          text,
          repaired,
          0,
          { before: "JSON 注释", after: "" },
          2,
        )
      : null;
  }
