// Origin: layout-engine/components.js; hero.layoutContract
import { scope as __doeScope } from "../../../../../registry/runtime/base/context/index.js";

export function createLayoutContract() {
  return {
      role: "flow",
      minWidth: 360,
      preferredWidth: 720,
      minHeight: 96,
      text: { reflow: true, minPt: __doeScope.H1_MIN_PT, optionalMinPt: __doeScope.H1_MIN_PT },
      canSplit: false,
      priority: 80,
    };
}
