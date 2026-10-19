import { abortError as __doeFn_abortError } from '../abort-error/index.js';
import { hasPendingSlideMedia as __doeFn_hasPendingSlideMedia } from '../has-pending-slide-media/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:399


export function waitForPendingSlideMedia(result, host, signal) {
    if (signal?.aborted) return Promise.reject((0, __doeFn_abortError)());
    if (!(0, __doeFn_hasPendingSlideMedia)(result, host)) return Promise.resolve(false);
    const observationHost = host?.nodeType
      ? host
      : result?.element?.parentElement || result?.element;
    if (!observationHost?.nodeType) return Promise.resolve(false);
    return new Promise((resolve, reject) => {
      let observer = null;
      const cleanup = () => {
        observer?.disconnect();
        observationHost.removeEventListener("load", check, true);
        observationHost.removeEventListener("error", check, true);
        observationHost.removeEventListener("slideengine:change", check);
        signal?.removeEventListener("abort", handleAbort);
      };
      const check = () => {
        if ((0, __doeFn_hasPendingSlideMedia)(result, host)) return;
        cleanup();
        resolve(true);
      };
      const handleAbort = () => {
        cleanup();
        reject((0, __doeFn_abortError)());
      };
      signal?.addEventListener("abort", handleAbort, { once: true });
      if (signal?.aborted) {
        handleAbort();
        return;
      }
      observationHost.addEventListener("load", check, true);
      observationHost.addEventListener("error", check, true);
      observationHost.addEventListener("slideengine:change", check);
      observer = new MutationObserver(check);
      observer.observe(observationHost, {
        attributes: true,
        attributeFilter: ["data-media-state"],
        childList: true,
        subtree: true,
      });
      check();
    });
  }
