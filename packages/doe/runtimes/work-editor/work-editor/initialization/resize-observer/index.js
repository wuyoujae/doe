import { handleEditorResize as __doeFn_handleEditorResize } from '../../handle-editor-resize/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:1793
import { scope as __doeScope } from "../../../../../integrations/work/editor/runtime/context/index.js";

export function initialize() {
__doeScope.resizeObserver = new ResizeObserver(__doeFn_handleEditorResize);
}
