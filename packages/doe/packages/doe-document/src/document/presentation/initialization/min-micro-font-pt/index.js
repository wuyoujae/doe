// Origin: public/yrkie-doe/layout-engine/layout-engine.js:57
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.MIN_MICRO_FONT_PT = Number(
    __doeScope.THEME_TYPOGRAPHY_STYLES?.small?.sizes?.compact ?? 9.5,
  );
}
