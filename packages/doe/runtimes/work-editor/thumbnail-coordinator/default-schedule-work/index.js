// Origin: public/yrkie-doe/work-editor/thumbnail-coordinator.js:20
import { scope as __doeScope } from "../runtime/context/index.js";

export function defaultScheduleWork(callback) {
    if (typeof __doeScope.global.requestIdleCallback === "function") {
      return {
        kind: "idle",
        id: __doeScope.global.requestIdleCallback(callback),
      };
    }
    const handle = { kind: "frame", id: 0, secondId: 0 };
    handle.id = __doeScope.global.requestAnimationFrame(() => {
      handle.secondId = __doeScope.global.requestAnimationFrame(callback);
    });
    return handle;
  }
