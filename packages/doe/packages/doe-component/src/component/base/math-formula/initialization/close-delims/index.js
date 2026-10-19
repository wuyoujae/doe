// Origin: public/yrkie-doe/components/math-formula/math-formula.js:88
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.CLOSE_DELIMS = new Set([")", "]", "}", "|", "\\vert", "\\Vert", "\\|",
    "rfloor", "rceil", "rangle", "rvert", "rVert", "/", "backslash"]);
}
