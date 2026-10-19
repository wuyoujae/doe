// Origin: public/yrkie-doe/layout-engine/layout-engine.js:6703
import { scope as __doeScope } from "../../runtime/context/index.js";

export function setAssetUrlResolver(resolver) {
    if (resolver !== null && typeof resolver !== "function") {
      throw new TypeError("SlideEngine asset URL resolver must be a function or null.");
    }
    __doeScope.assetUrlResolver = resolver;
    // A resolver can change when the embedding page changes its delivery
    // strategy (for example, direct HTTP versus the local Studio proxy).
    __doeScope.backgroundForegroundCache.clear();
  }
