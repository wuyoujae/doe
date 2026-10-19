// Origin: public/yrkie-doe/export-runtime/export-runtime.js:43
import { scope as __doeScope } from "../../../../../runtime/context/index.js";

export function clone(value) {
    return typeof __doeScope.global.structuredClone === "function"
      ? __doeScope.global.structuredClone(value)
      : JSON.parse(JSON.stringify(value));
  }
