// Origin: layout-engine/components.js; code-block.layoutContract
import { scope as __doeScope } from "../../../../../registry/runtime/base/context/index.js";

export function createLayoutContract() {
  return {
      role: "wide",
      minWidth: 300,
      preferredWidth: 560,
      minHeight: 150,
      preferredAxes: ["row", "stack"],
      text: { reflow: true, minPt: __doeScope.NORMAL_MIN_PT, optionalMinPt: __doeScope.NORMAL_MIN_PT },
      canSplit: false,
      priority: 78,
    };
}
