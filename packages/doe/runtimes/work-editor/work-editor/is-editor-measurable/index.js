// Origin: public/yrkie-doe/work-editor/work-editor.js:1074
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function isEditorMeasurable() {
    return __doeScope.state.hostVisible
      && __doeScope.elements.frame.clientWidth > 1
      && __doeScope.elements.frame.clientHeight > 1;
  }
