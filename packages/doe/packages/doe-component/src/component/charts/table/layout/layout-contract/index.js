// Origin: layout-engine/library-components.js; table.layoutContract
import { scope as __doeScope } from "../../../../../registry/runtime/library/context/index.js";

export function createLayoutContract() {
  return {
      role: "wide",
      minWidth: 480,
      preferredWidth: 840,
      minHeight: 160,
      preferredAxes: ["stack", "row"],
      text: { reflow: true, minPt: __doeScope.NORMAL_MIN_PT, optionalMinPt: __doeScope.NORMAL_MIN_PT },
      preserveAspect: false,
      priority: 82,
    };
}
