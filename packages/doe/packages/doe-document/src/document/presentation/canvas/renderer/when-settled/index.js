import { throwIfAborted } from '../../../../../../../doe-core/src/runtime/throw-if-aborted/index.js';

// A decoded image can enqueue another rebuild after the initial mount resolves.
// Only publish a snapshot when its assets, queue, DOM and report share one epoch.
export async function whenSettled(state, { timeoutMs = 30_000 } = {}) {
  const document = state.host.ownerDocument;
  const window = document.defaultView;
  const cleanups = new Set();
  let expired = false;
  let timer;
  const check = () => {
    throwIfAborted(state);
    if (expired) throw new Error('SlideEngine render did not settle before the deadline.');
    if (state.mediaMetadataError) throw state.mediaMetadataError;
  };
  const frame = () => new Promise(resolve => {
    const id = window.requestAnimationFrame(() => { cleanups.delete(cancel); resolve(); });
    const cancel = () => window.cancelAnimationFrame(id);
    cleanups.add(cancel);
  });
  const imageReady = async image => {
    if (!image.complete) await new Promise(resolve => {
      const finish = () => { cleanup(); resolve(); };
      const cleanup = () => {
        image.removeEventListener('load', finish);
        image.removeEventListener('error', finish);
        cleanups.delete(cleanup);
      };
      cleanups.add(cleanup);
      image.addEventListener('load', finish, { once: true });
      image.addEventListener('error', finish, { once: true });
      if (image.complete) finish();
    });
    check();
    if (image.naturalWidth > 0 && typeof image.decode === 'function') {
      await image.decode().catch(() => undefined);
    }
  };
  const settle = async () => {
    for (;;) {
      check();
      const queue = state.queue;
      await queue;
      check();
      const element = state.slideElement;
      const epoch = state.renderEpoch;
      await Promise.all([
        document.fonts?.ready,
        ...Array.from(element?.querySelectorAll('img') || [], imageReady),
      ]);
      check();
      // This flushes scheduled metadata callbacks; elapsed frames alone are not readiness.
      await frame();
      check();
      if (queue === state.queue && !state.mediaMetadataRebuildQueued &&
          !state.mediaMetadataFrame && element === state.slideElement &&
          element === state.result?.element && epoch === state.renderEpoch &&
          document.fonts?.status !== 'loading') {
        if (!element || !state.host.contains(element)) throw new Error('SlideEngine render root is unavailable.');
        return { element, renderEpoch: epoch };
      }
    }
  };
  try {
    return await Promise.race([
      settle(),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          expired = true;
          reject(new Error('SlideEngine render did not settle before the deadline.'));
        }, timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
    for (const cleanup of cleanups) cleanup();
  }
}
