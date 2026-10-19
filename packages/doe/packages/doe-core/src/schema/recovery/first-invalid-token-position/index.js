import { lexicalInfo as __doeFn_lexicalInfo } from '../lexical-info/index.js';
// Origin: public/yrkie-doe/core/schema-json-recovery.js:127


export function firstInvalidTokenPosition(text) {
    const { outside } = (0, __doeFn_lexicalInfo)(text);
    for (let index = 0; index < text.length; index += 1) {
      if (!outside[index] || /\s/.test(text[index])) continue;
      const character = text[index];
      if ('{}[],:"'.includes(character) || /[\d+\-.eE]/.test(character)) continue;
      if (character === "/" || character === "'" || /[A-Za-z_$\u0080-\uFFFF]/.test(character)) {
        const rest = text.slice(index);
        const literal = rest.match(/^(true|false|null)\b/);
        if (literal) {
          index += literal[0].length - 1;
          continue;
        }
        return index;
      }
    }
    return null;
  }
