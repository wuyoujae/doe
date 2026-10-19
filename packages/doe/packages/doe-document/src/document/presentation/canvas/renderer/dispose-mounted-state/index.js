// Origin: public/yrkie-doe/layout-engine/layout-engine.js:10340
import { scope as __doeScope } from "../../../runtime/context/index.js";

export function disposeMountedState(state) {
    if (!state || state.disposed) return;
    state.disposed = true;
    state.host.querySelectorAll('[data-chart-runtime]').forEach(root => root.__disposeChartInteraction?.());
    state.itemDragCleanup?.();
    state.deletionCleanup?.();
    state.overflowTooltipCleanup?.();
    if (
      state.mediaMetadataFrame
      && typeof __doeScope.global.cancelAnimationFrame === "function"
    ) {
      __doeScope.global.cancelAnimationFrame(state.mediaMetadataFrame);
    }
    state.mediaMetadataFrame = 0;
    state.mediaMetadataRebuildQueued = false;
    if (state.mediaMetadataListener) {
      state.host.removeEventListener(
        "slideengine:media-metadata",
        state.mediaMetadataListener,
      );
    }
    if (__doeScope.mountedStates.get(state.host) === state) {
      __doeScope.mountedStates.delete(state.host);
    }
  }
