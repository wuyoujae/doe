// Origin: public/yrkie-doe/layout-engine/layout-engine.js:249
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
if (!__doeScope.THEME_TYPOGRAPHY) {
    throw new Error("layout-engine.js requires the Yrkie theme registry.");
  }
}
