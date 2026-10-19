import { editablePlainText as __doeFn_editablePlainText } from '../../../../../../doe-canvas/src/editor/editable-plain-text/index.js';
import { fitLiveTextEdit as __doeFn_fitLiveTextEdit } from "../../canvas/editor/fit-live-text-edit/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:5462
import { scope as __doeScope } from "../../runtime/context/index.js";

export function scheduleLiveTextFit(session, state) {
    if (!session || session.finished) return;
    session.draftValue = (0, __doeFn_editablePlainText)(session.target);
    if (session.frame) return;
    const schedule = __doeScope.global.requestAnimationFrame || ((callback) => callback());
    session.frame = schedule(() => {
      session.frame = 0;
      (0, __doeFn_fitLiveTextEdit)(session, state);
      if (session.semanticText && !session.composing) __doeScope.global.SemanticTextLayout.refreshEditing(session.target, session.semanticText);
    });
  }
