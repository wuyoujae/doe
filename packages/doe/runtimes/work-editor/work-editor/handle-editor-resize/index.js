import { updateCanvasScale as __doeFn_updateCanvasScale } from '../update-canvas-scale/index.js';
import { schedulePendingDeckRender as __doeFn_schedulePendingDeckRender } from '../schedule-pending-deck-render/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:1102
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function handleEditorResize() {
    if (!(0, __doeFn_updateCanvasScale)()) {
      __doeScope.state.pendingDeckRender = true;
      __doeScope.state.renderToken += 1;
      __doeScope.state.activeMountAbortController?.abort();
      __doeScope.state.thumbnailCoordinator?.cancelBackground({ clearQueue: true });
      return;
    }
    (0, __doeFn_schedulePendingDeckRender)();
  }
