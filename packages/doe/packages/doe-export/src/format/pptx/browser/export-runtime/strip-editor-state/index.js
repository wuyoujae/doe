import canvas from '../../../../../../../doe-document/src/document/presentation/canvas/base-attributes/index.json' with { type: 'json' };
import { freezeComputedStyles as __doeFn_freezeComputedStyles } from '../freeze-computed-styles/index.js';
// Origin: public/yrkie-doe/export-runtime/export-runtime.js:140
import { scope as __doeScope } from "../../../../../runtime/context/index.js";

export function stripEditorState(element) {
    const cloned = element.cloneNode(true);
    (0, __doeFn_freezeComputedStyles)(element, cloned);
    const sanitize = __doeScope.global.SlideEngine?.sanitizeStaticElement;
    if (typeof sanitize !== "function") {
      throw new Error("SlideEngine 静态快照清理器未加载");
    }
    sanitize(cloned);
    cloned.removeAttribute("data-selected");
    cloned.setAttribute("data-export-snapshot", "true");
    cloned.style.width = `${canvas.renderWidth}px`;
    cloned.style.height = `${canvas.renderHeight}px`;
    cloned.style.margin = "0";
    cloned.style.transform = "none";
    cloned.style.transformOrigin = "0 0";
    return cloned;
  }
