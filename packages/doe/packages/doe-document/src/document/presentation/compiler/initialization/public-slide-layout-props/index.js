// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:89
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.PUBLIC_SLIDE_LAYOUT_PROPS = new Set([
    "preset",
    "overflowPolicy",
    "autoRepair",
    "maxRepairPasses",
    "fallback",
    "allowEmergency8Pt",
    "spacing",
  ]);
}
