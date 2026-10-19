// Origin: public/yrkie-doe/layout-engine/layout-engine.js:181
import { scope as __doeScope } from '../browser-context/index.js';

export function createAbortError() {
    if (typeof __doeScope.global.DOMException === "function") {
      return new __doeScope.global.DOMException("SlideEngine operation was aborted", "AbortError");
    }
    const error = new Error("SlideEngine operation was aborted");
    error.name = "AbortError";
    return error;
  }
