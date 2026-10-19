// Origin: public/yrkie-doe/components/math-formula/math-formula.js:104
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.ENVIRONMENTS = new Set([
    "matrix", "pmatrix", "bmatrix", "vmatrix", "Vmatrix", "cases",
    "aligned", "align", "alignedat", "array",
  ]);
}
