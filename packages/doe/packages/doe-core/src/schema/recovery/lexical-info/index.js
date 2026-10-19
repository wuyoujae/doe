// Origin: public/yrkie-doe/core/schema-json-recovery.js:98


export function lexicalInfo(text) {
    const outside = new Array(text.length).fill(true);
    const strings = [];
    let inString = false;
    let escaped = false;
    let start = -1;
    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      if (!inString && character === '"') {
        inString = true;
        escaped = false;
        start = index;
        outside[index] = false;
        continue;
      }
      if (!inString) continue;
      outside[index] = false;
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') {
        inString = false;
        strings.push({ start, end: index, closed: true });
        start = -1;
      }
    }
    if (inString) strings.push({ start, end: text.length, closed: false });
    return { outside, strings };
  }
