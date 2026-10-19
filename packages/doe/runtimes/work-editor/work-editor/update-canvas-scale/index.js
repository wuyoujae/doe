import { isEditorMeasurable as __doeFn_isEditorMeasurable } from '../is-editor-measurable/index.js';
import { hasIndependentCanvases, resizeContinuousCanvases } from '../continuous-view/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:1080
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function updateCanvasScale() {
    if (hasIndependentCanvases()) return __doeScope.state.hostVisible && resizeContinuousCanvases();
    if (!(0, __doeFn_isEditorMeasurable)()) return false;
    return __doeScope.elements.frame.resize();
  }
