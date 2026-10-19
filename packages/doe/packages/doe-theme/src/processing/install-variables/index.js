import { cssVariables as __doeFn_cssVariables } from "../css-variables/index.js";
// Origin: public/yrkie-doe/core/theme.js:240
import { scope as __doeScope } from "../../runtime/context/index.js";

export function installVariables(element, theme = __doeScope.YRKIE_THEME) {
    if (!element?.style) return;
    Object.entries((0, __doeFn_cssVariables)(theme)).forEach(([name, value]) => element.style.setProperty(name, value));
  }
