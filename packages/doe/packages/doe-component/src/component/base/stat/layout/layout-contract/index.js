// Origin: layout-engine/components.js; stat.layoutContract
import { scope as __doeScope } from "../../../../../registry/runtime/base/context/index.js";

export function createLayoutContract() {
  return {
      role: "compact",
      minWidth: 280,
      preferredWidth: 420,
      minHeight: 96,
      preferredAxes: ["row", "stack"],
      text: { reflow: true, minPt: __doeScope.NORMAL_MIN_PT, optionalMinPt: __doeScope.NORMAL_MIN_PT },
      priority: 70,
    };
}
