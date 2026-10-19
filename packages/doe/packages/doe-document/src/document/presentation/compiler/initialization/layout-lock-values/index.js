// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:111
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.LAYOUT_LOCK_VALUES = new Set([
    "all",
    "layout",
    "structure",
    "columns",
    "itemLayout",
    "typography",
  ]);
}
