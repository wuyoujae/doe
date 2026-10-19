// Origin: public/yrkie-doe/layout-engine/layout-engine.js:54
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.MIN_READABLE_FONT_PT = Number(
    __doeScope.THEME_TYPOGRAPHY_STYLES?.normal?.sizes?.compact ?? 12.5,
  );
}
