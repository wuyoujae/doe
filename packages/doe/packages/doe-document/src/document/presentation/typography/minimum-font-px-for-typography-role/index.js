// Origin: public/yrkie-doe/layout-engine/layout-engine.js:8094
import { scope as __doeScope } from "../../runtime/context/index.js";

export function minimumFontPxForTypographyRole(role, defaultMinimumPx) {
    return role === "supporting"
      ? __doeScope.MIN_MICRO_FONT_PT * __doeScope.CSS_PIXELS_PER_POINT
      : Math.min(defaultMinimumPx, __doeScope.MIN_MICRO_FONT_PT * __doeScope.CSS_PIXELS_PER_POINT);
  }
