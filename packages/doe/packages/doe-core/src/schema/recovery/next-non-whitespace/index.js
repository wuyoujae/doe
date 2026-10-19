// Origin: public/yrkie-doe/core/schema-json-recovery.js:198


export function nextNonWhitespace(text, from) {
    for (let index = Math.max(0, from); index < text.length; index += 1) {
      if (!/\s/.test(text[index])) return index;
    }
    return -1;
  }
