// Origin: public/yrkie-doe/components/math-formula/math-formula.js:86
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.OPEN_DELIMS = new Set(["(", "[", "{", "|", "\\vert", "\\Vert", "\\|",
    "lfloor", "lceil", "langle", "lvert", "lVert", "/", "backslash"]);
}
