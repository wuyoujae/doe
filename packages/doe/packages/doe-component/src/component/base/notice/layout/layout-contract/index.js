// Origin: layout-engine/components.js; notice.layoutContract
import { scope as __doeScope } from "../../../../../registry/runtime/base/context/index.js";

export function createLayoutContract() {
  return {
      role: "wide", minWidth: 240, preferredWidth: 960, minHeight: 48,
      preferredAxes: ["stack"], text: { reflow: true, minPt: __doeScope.NORMAL_MIN_PT, optionalMinPt: __doeScope.NORMAL_MIN_PT },
      canSplit: false, priority: 80,
    };
}
