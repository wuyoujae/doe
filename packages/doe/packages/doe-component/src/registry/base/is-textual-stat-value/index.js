// Origin: public/yrkie-doe/layout-engine/components.js:51


export function isTextualStatValue(value) {
    const source = String(value ?? "").trim();
    if (!source || /\d/u.test(source)) return false;
    const latinWords = source.match(/[A-Za-z]+(?:[-'][A-Za-z]+)*/gu) || [];
    return latinWords.length >= 3 || [...source].length >= 18;
  }
