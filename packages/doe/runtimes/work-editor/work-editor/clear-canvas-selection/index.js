// Origin: public/yrkie-doe/work-editor/work-editor.js:1583
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function clearCanvasSelection() {
    void __doeScope.state.activeResult?.clearSelection?.().catch(error => {
      if (!isAbortError(error)) console.error("Canvas selection could not be cleared", error);
    });
  }
