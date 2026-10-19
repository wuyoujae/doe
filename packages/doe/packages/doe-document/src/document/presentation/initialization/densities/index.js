// Origin: public/yrkie-doe/layout-engine/layout-engine.js:237
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.DENSITIES = Object.freeze([
    { id: "comfortable", compression: 0 },
    { id: "compact", compression: 1 },
    { id: "tight", compression: 2 },
    { id: "small-default", compression: 2 },
    { id: "small-compact", compression: 2 },
    { id: "minimum", compression: 2 },
    { id: "minimum-final", compression: 2 },
    { id: "minimum-expanded", compression: 2 },
    { id: "micro", compression: 2 },
  ]);
}
