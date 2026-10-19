// Origin: public/yrkie-doe/components/math-formula/math-formula.js:55
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.BIGOP_FAMILY = new Set([
    "sum", "prod", "coprod", "int", "iint", "iiint", "oint",
    "bigcup", "bigcap", "bigoplus", "bigotimes",
  ]);
}
