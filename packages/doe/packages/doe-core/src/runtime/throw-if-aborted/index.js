import { createAbortError as __doeFn_createAbortError } from '../create-abort-error/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:194


export function throwIfAborted(state) {
    if (state?.disposed || state?.signal?.aborted) throw (0, __doeFn_createAbortError)();
  }
