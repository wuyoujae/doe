// Origin: public/yrkie-doe/work-editor/work-editor.js:1476
import { scope as __doeScope } from "../../../../../integrations/work/editor/runtime/context/index.js";

export function initialize() {
__doeScope.elements.frame.parentElement.addEventListener(
    "pointerdown",
    () => { __doeScope.state.thumbnailCoordinator?.interrupt(); },
    true,
  );
}
