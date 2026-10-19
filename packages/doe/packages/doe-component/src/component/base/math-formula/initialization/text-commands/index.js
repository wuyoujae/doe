// Origin: public/yrkie-doe/components/math-formula/math-formula.js:91
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.TEXT_COMMANDS = new Set([
    "text", "mathrm", "operatorname", "mathit", "mathbf", "boldsymbol",
    "mathsf", "mathtt", "mathbb", "mathcal", "mathfrak",
    "textit", "textbf", "textrm", "textup",
  ]);
}
