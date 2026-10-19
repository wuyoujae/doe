import { editablePlainText as __doeFn_editablePlainText } from '../../../../../../doe-canvas/src/editor/editable-plain-text/index.js';
import { fitLiveTextEdit as __doeFn_fitLiveTextEdit } from "../../canvas/editor/fit-live-text-edit/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:5474
import { scope as __doeScope } from "../../runtime/context/index.js";

export function flushLiveTextFit(session, state) {
    if (!session || session.finished) return;
    if (session.frame && typeof __doeScope.global.cancelAnimationFrame === "function") {
      __doeScope.global.cancelAnimationFrame(session.frame);
    }
    session.frame = 0;
    session.draftValue = (0, __doeFn_editablePlainText)(session.target);
    (0, __doeFn_fitLiveTextEdit)(session, state);
  }
