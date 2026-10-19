// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:251
import { scope as __doeScope } from "../runtime/context/index.js";

export function normalizeLayoutLock(source) {
    if (source === true || __doeScope.LAYOUT_LOCK_VALUES.has(source)) return source;
    if (Array.isArray(source)) {
      const values = [...new Set(source.filter((value) => __doeScope.LAYOUT_LOCK_VALUES.has(value)))];
      return values.length ? values : null;
    }
    if (source && typeof source === "object") {
      const output = {};
      __doeScope.LAYOUT_LOCK_VALUES.forEach((key) => {
        if (source[key] === true) output[key] = true;
      });
      return Object.keys(output).length ? output : null;
    }
    return null;
  }
