// Origin: public/yrkie-doe/canvas/canvas.js:14
import { scope as __doeScope } from "../runtime/context/index.js";

export function waitForAssets(assets, signal, timeoutMs, progressive) {
    return new Promise((resolve, reject) => {
      const finish = (error, pending = false) => {
        clearTimeout(timeout); signal.removeEventListener("abort", abort);
        error ? reject(error) : resolve(pending);
      };
      const timeout = __doeScope.global.setTimeout(() => progressive ? finish(null, true) : finish(new Error("Canvas assets timed out")), timeoutMs);
      const abort = () => finish(new DOMException("Canvas disposed", "AbortError"));
      signal.addEventListener("abort", abort, { once: true });
      if (signal.aborted) abort();
      else assets.then(() => finish(), finish);
    });
  }
