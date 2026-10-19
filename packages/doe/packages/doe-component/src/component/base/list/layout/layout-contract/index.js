// Origin: layout-engine/components.js; list.layoutContract
import { scope as __doeScope } from "../../../../../registry/runtime/base/context/index.js";

export function createLayoutContract() {
  return {
      role: "flow",
      minWidth: 360,
      preferredWidth: 540,
      minHeight: 104,
      preferredAxes: ["stack", "row"],
      text: { reflow: true, minPt: __doeScope.NORMAL_MIN_PT, optionalMinPt: __doeScope.SMALL_MIN_PT },
      canSplit: true,
      priority: 72,
    };
}
