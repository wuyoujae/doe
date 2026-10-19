// Origin: public/yrkie-doe/components/math-formula/math-formula.js:127
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.CTRL_MAP = {
    "\\": { type: "break" },
    "&": { type: "amp" },
    "%": { type: "sym", value: "%" },
    "$": { type: "sym", value: "$" },
    "#": { type: "sym", value: "#" },
    "{": { type: "sym", value: "{" },
    "}": { type: "sym", value: "}" },
    "_": { type: "sym", value: "_" },
    " ": { type: "space-ctrl" },
  };
}
