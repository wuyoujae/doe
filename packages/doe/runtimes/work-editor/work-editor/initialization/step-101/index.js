import { schedulePendingDeckRender as __doeFn_schedulePendingDeckRender } from '../../schedule-pending-deck-render/index.js';
import { pauseContinuousView, resumeContinuousView } from '../../continuous-view/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:1795
import { scope as __doeScope } from "../../../../../integrations/work/editor/runtime/context/index.js";

export function initialize() {
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      pauseContinuousView();
      __doeScope.state.pendingDeckRender = true;
      __doeScope.state.renderToken += 1;
      __doeScope.state.activeMountAbortController?.abort();
      __doeScope.state.thumbnailCoordinator?.cancelBackground({ clearQueue: true });
      return;
    }
    (0, __doeFn_schedulePendingDeckRender)();
    __doeScope.state.thumbnailCoordinator?.resume();
    resumeContinuousView();
  });
}
