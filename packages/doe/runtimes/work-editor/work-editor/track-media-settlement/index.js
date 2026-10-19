import { waitForPendingSlideMedia as __doeFn_waitForPendingSlideMedia } from '../wait-for-pending-slide-media/index.js';
import { waitForAnimationFrame as __doeFn_waitForAnimationFrame } from '../wait-for-animation-frame/index.js';
import { waitForAbortable as __doeFn_waitForAbortable } from '../wait-for-abortable/index.js';
import { hasPendingSlideMedia as __doeFn_hasPendingSlideMedia } from '../has-pending-slide-media/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:443
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function trackMediaSettlement(host, signal) {
    let metadataEpoch = 0;
    const handleMetadata = () => {
      metadataEpoch += 1;
    };
    host.addEventListener("slideengine:media-metadata", handleMetadata);
    return {
      async wait(result) {
        const deadlineController = new AbortController();
        let deadlineReached = false;
        const forwardAbort = () => deadlineController.abort();
        signal?.addEventListener("abort", forwardAbort, { once: true });
        if (signal?.aborted) deadlineController.abort();
        const deadline = __doeScope.global.setTimeout(() => {
          deadlineReached = true;
          deadlineController.abort();
        }, __doeScope.MEDIA_SETTLEMENT_TIMEOUT_MS);
        try {
          while (true) {
            const waitedForMedia = await (0, __doeFn_waitForPendingSlideMedia)(
              result,
              host,
              deadlineController.signal,
            );
            const observedEpoch = metadataEpoch;
            // SlideEngine batches intrinsic metadata reflow on the next frame
            // and exposes completed work through its mutation queue. Waiting
            // for that queue after the event-driven media gate avoids measuring
            // the pre-image DOM without treating a fixed delay as settlement.
            if (waitedForMedia || observedEpoch > 0) {
              await (0, __doeFn_waitForAnimationFrame)(deadlineController.signal);
            }
            await (0, __doeFn_waitForAbortable)(
              result?.flushPendingEdits?.(),
              deadlineController.signal,
            );
            if (
              !(0, __doeFn_hasPendingSlideMedia)(result, host)
              && observedEpoch === metadataEpoch
            ) return true;
          }
        } catch (error) {
          if (deadlineReached && error?.name === "AbortError") return false;
          throw error;
        } finally {
          __doeScope.global.clearTimeout(deadline);
          signal?.removeEventListener("abort", forwardAbort);
        }
      },
      dispose() {
        host.removeEventListener("slideengine:media-metadata", handleMetadata);
      },
    };
  }
