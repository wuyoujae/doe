// Origin: public/yrkie-doe/core/semantic-text-layout.js:168


export function lineText(tokens, start, end) {
    let text = "";
    for (let index = start; index < end; index += 1) {
      const token = tokens[index];
      if (index > start || start === 0) text += token.gapBefore ?? (token.spaceBefore ? " " : "");
      text += token.text;
    }
    if (end === tokens.length) text += tokens.at(-1)?.trailing || "";
    return text;
  }
