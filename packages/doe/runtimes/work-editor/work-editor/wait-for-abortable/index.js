import { abortError as __doeFn_abortError } from '../abort-error/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:366


export function waitForAbortable(promise, signal) {
    if (signal?.aborted) return Promise.reject((0, __doeFn_abortError)());
    return new Promise((resolve, reject) => {
      const cleanup = () => signal?.removeEventListener("abort", handleAbort);
      const handleAbort = () => {
        cleanup();
        reject((0, __doeFn_abortError)());
      };
      signal?.addEventListener("abort", handleAbort, { once: true });
      if (signal?.aborted) {
        handleAbort();
        return;
      }
      Promise.resolve(promise).then(
        (value) => {
          cleanup();
          resolve(value);
        },
        (error) => {
          cleanup();
          reject(error);
        },
      );
    });
  }
