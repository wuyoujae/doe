import { isEditorMeasurable as __doeFn_isEditorMeasurable } from '../is-editor-measurable/index.js';
import { renderDeck as __doeFn_renderDeck } from '../render-deck/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:1085
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function schedulePendingDeckRender() {
    if (!__doeScope.state.fontsReady || !__doeScope.state.pendingDeckRender || !__doeScope.state.hostVisible) return;
    if (__doeScope.state.resumeRenderScheduled) return;
    __doeScope.state.resumeRenderScheduled = true;
    __doeScope.global.requestAnimationFrame(() => {
      __doeScope.state.resumeRenderScheduled = false;
      if (!__doeScope.state.pendingDeckRender || !__doeScope.state.hostVisible) return;
      if (!(0, __doeFn_isEditorMeasurable)()) {
        __doeScope.state.resumeRenderAttempts += 1;
        if (__doeScope.state.resumeRenderAttempts < 8) (0, schedulePendingDeckRender)();
        return;
      }
      __doeScope.state.resumeRenderAttempts = 0;
      void (0, __doeFn_renderDeck)();
    });
  }
