// Origin: public/yrkie-doe/layout-engine/layout-engine.js:565
import { scope as __doeScope } from '../runtime/context/index.js';

export function registerLayoutPolicy(id, definition) {
    if (!id || typeof id !== "string" || !definition) {
      throw new Error("SlideEngine.registerLayoutPolicy: 参数无效。");
    }
    __doeScope.layoutPolicies.set(id, {
      phase: "repair",
      priority: 50,
      ...definition,
      id,
    });
  }
