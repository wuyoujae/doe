// Origin: public/yrkie-doe/core/theme.js:121
import { scope as __doeScope } from "../../runtime/context/index.js";

export function valueAtPath(path) {
    return String(path || "").split(".").reduce((value, key) => value?.[key], __doeScope.YRKIE_THEME.colors);
  }
