// Origin: public/yrkie-doe/components/math-formula/math-formula.js:1099


export function readNumber(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  }
