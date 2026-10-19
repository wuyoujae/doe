import { parseFormula as __doeFn_parseFormula } from '../parse-formula/index.js';
import { estimateEmHeight as __doeFn_estimateEmHeight } from '../estimate-em-height/index.js';
// Origin: public/yrkie-doe/components/math-formula/math-formula.js:1068
import { scope as __doeScope } from "../runtime/context/index.js";

export function estimateHeight(source, widthPx) {
    const parsed = (0, __doeFn_parseFormula)(source);
    const emTotal = Math.max(1, (0, __doeFn_estimateEmHeight)(parsed.ast));
    // Initial estimate only; mounted MathML owns the final content height.
    const base = __doeScope.global.PPTTheme?.theme?.typography?.styles?.h4?.sizes?.default || 15.5;
    return Math.ceil(emTotal * base * (4 / 3) + 18);
  }
