// Origin: public/yrkie-doe/components/math-formula/math-formula.js:826


export function symbolTag(node) {
    const value = String(node.char || "");
    if (/^[0-9]+(?:[.,][0-9]+)?$/.test(value)) return "mn";
    if (/^[A-Za-z\u0370-\u03ff]$/.test(value) || node.italic) return "mi";
    return "mo";
  }
