// Origin: public/yrkie-doe/layout-engine/layout-engine.js:278
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.TYPOGRAPHY = Object.freeze({
    styleIds: Object.freeze(Object.keys(__doeScope.TYPOGRAPHY_STYLES)),
    sizeModes: __doeScope.TYPOGRAPHY_SIZE_MODES,
    weights: __doeScope.TYPOGRAPHY_WEIGHTS,
    styles: __doeScope.TYPOGRAPHY_STYLES,
  });
}
