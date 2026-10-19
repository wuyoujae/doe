// Origin: public/yrkie-doe/core/schema-json-recovery.js:191


export function previousNonWhitespace(text, from) {
    for (let index = Math.min(from, text.length - 1); index >= 0; index -= 1) {
      if (!/\s/.test(text[index])) return index;
    }
    return -1;
  }
