// Origin: public/yrkie-doe/core/schema-json-recovery.js:56
import { scope as __doeScope } from "../runtime/context/index.js";

export function scanStructure(text) {
    const stack = [];
    let inString = false;
    let escaped = false;
    let stringStart = -1;
    let mismatch = null;

    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      if (inString) {
        if (escaped) escaped = false;
        else if (character === "\\") escaped = true;
        else if (character === '"') inString = false;
        continue;
      }
      if (character === '"') {
        inString = true;
        stringStart = index;
        continue;
      }
      if (__doeScope.OPEN_TO_CLOSE[character]) {
        stack.push({ open: character, close: __doeScope.OPEN_TO_CLOSE[character], index });
        continue;
      }
      if (__doeScope.CLOSE.has(character)) {
        const expected = stack[stack.length - 1]?.close || null;
        if (expected !== character) {
          mismatch = {
            index,
            actual: character,
            expected,
            stack: stack.map((entry) => ({ ...entry })),
          };
          break;
        }
        stack.pop();
      }
    }

    return { stack, inString, escaped, stringStart, mismatch };
  }
