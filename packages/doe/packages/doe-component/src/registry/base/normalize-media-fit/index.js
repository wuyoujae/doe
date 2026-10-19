// Origin: public/yrkie-doe/layout-engine/components.js:78
import { scope as __doeScope } from "../../runtime/base/context/index.js";

export function normalizeMediaFit(value) {
    return __doeScope.MEDIA_FIT_MODES.has(value) ? value : "auto";
  }
