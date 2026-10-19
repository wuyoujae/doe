// Origin: public/yrkie-doe/work-editor/thumbnail-coordinator.js:34
import { scope as __doeScope } from "../runtime/context/index.js";

export function defaultCancelWork(handle) {
    if (!handle) return;
    if (handle.kind === "idle" && typeof __doeScope.global.cancelIdleCallback === "function") {
      __doeScope.global.cancelIdleCallback(handle.id);
      return;
    }
    if (typeof __doeScope.global.cancelAnimationFrame === "function") {
      if (handle.id) __doeScope.global.cancelAnimationFrame(handle.id);
      if (handle.secondId) __doeScope.global.cancelAnimationFrame(handle.secondId);
    }
  }
