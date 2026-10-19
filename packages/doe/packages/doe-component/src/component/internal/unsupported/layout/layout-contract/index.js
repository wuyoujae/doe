// Origin: layout-engine/components.js; unsupported.layoutContract
import { scope as __doeScope } from "../../../../../registry/runtime/base/context/index.js";

export function createLayoutContract() {
  return {
      role: "flow",
      minWidth: 280,
      preferredWidth: 420,
      minHeight: 72,
      text: { reflow: true, minPt: __doeScope.NORMAL_MIN_PT, optionalMinPt: __doeScope.SMALL_MIN_PT },
      canSplit: false,
      priority: 10,
    };
}
