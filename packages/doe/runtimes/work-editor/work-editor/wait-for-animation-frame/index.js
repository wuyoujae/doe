import { abortError as __doeFn_abortError } from '../abort-error/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:339
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function waitForAnimationFrame(signal) {
    if (signal?.aborted) return Promise.reject((0, __doeFn_abortError)());
    return new Promise((resolve, reject) => {
      let frame = 0;
      const cleanup = () => {
        signal?.removeEventListener("abort", handleAbort);
      };
      const handleAbort = () => {
        if (frame && typeof __doeScope.global.cancelAnimationFrame === "function") {
          __doeScope.global.cancelAnimationFrame(frame);
        }
        cleanup();
        reject((0, __doeFn_abortError)());
      };
      signal?.addEventListener("abort", handleAbort, { once: true });
      if (signal?.aborted) {
        handleAbort();
        return;
      }
      const schedule = __doeScope.global.requestAnimationFrame || ((callback) => callback());
      frame = schedule(() => {
        cleanup();
        resolve();
      });
    });
  }
