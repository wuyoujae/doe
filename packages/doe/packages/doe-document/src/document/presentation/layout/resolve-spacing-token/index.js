// Origin: public/yrkie-doe/layout-engine/layout-engine.js:582
import { scope as __doeScope } from "../../runtime/context/index.js";

export function resolveSpacingToken(value, compression = 0, fallback = "18pt") {
    if (Number.isFinite(Number(value))) return Math.max(0, Number(value));
    const token = __doeScope.SPACING_TOKENS[value] ? value : fallback;
    const index = Math.max(0, __doeScope.SPACING_ORDER.indexOf(token));
    return __doeScope.SPACING_TOKENS[__doeScope.SPACING_ORDER[Math.max(0, index - compression)]];
  }
