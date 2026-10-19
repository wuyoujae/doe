// Origin: public/yrkie-doe/layout-engine/layout-engine.js:145
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.COMPOSITION_RATIOS = Object.freeze({
    auto: null,
    balanced: [1, 1],
    "primary-first": [3, 2],
    "primary-second": [2, 3],
  });
}
