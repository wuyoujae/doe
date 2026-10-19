// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:56
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.PUBLIC_LEAF_LAYOUT_PROPS = new Set([
    "span",
    "priority",
    "region",
    "lock",
    "textFit",
    "slotSpace",
  ]);
}
