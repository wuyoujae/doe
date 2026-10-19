// Origin: public/yrkie-doe/layout-engine/components.js:227
import { scope as __doeScope } from "../../runtime/base/context/index.js";

export function normalizeMediaFormat(value) {
    const format = String(value || "auto").toLowerCase();
    return __doeScope.MEDIA_FORMATS.has(format) ? format : "auto";
  }
