// Origin: public/yrkie-doe/components/math-formula/math-formula.js:79
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.DELIM_ALIAS = {
    "{": "{", "}": "}", "(": "(", ")": ")", "[": "[", "]": "]",
    "|": "|", "\\vert": "|", "\\Vert": "‖", "\\|": "‖",
    lfloor: "⌊", rfloor: "⌋", lceil: "⌈", rceil: "⌉",
    langle: "⟨", rangle: "⟩", lvert: "|", rvert: "|", lVert: "‖", rVert: "‖",
    "/": "/", backslash: "\\", ".": null,
  };
}
