// Origin: layout-engine/components.js; text.layoutContract
import { scope as __doeScope } from "../../../../../registry/runtime/base/context/index.js";

export function createLayoutContract() {
  return {
      role: "flow",
      minWidth: 340,
      preferredWidth: 500,
      minHeight: 88,
      preferredAxes: ["stack", "row"],
      text: { reflow: true, minPt: __doeScope.NORMAL_MIN_PT, optionalMinPt: __doeScope.SMALL_MIN_PT },
      canSplit: true,
      priority: 70,
    };
}
