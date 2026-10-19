// Origin: layout-engine/library-components.js; math-formula.layoutContract
import { scope as __doeScope } from "../../../../../registry/runtime/library/context/index.js";

export function createLayoutContract() {
  return {
      role: "wide",
      minWidth: 380,
      preferredWidth: 620,
      minHeight: 32,
      preferredAxes: ["row", "stack"],
      text: { reflow: false, minPt: __doeScope.NORMAL_MIN_PT, optionalMinPt: __doeScope.NORMAL_MIN_PT },
      preserveAspect: false,
      priority: 78,
    };
}
