// Origin: public/yrkie-doe/core/semantic-text-layout.js:463
import { scope as __doeScope } from "../layout/runtime/context/index.js";

export function insertEditingText(element, text) {
    const selection = __doeScope.global.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (!element.contains(range.commonAncestorContainer)) return;
    element.dispatchEvent(new InputEvent("beforeinput", { inputType: "insertText", data: text, bubbles: true }));
    range.deleteContents();
    const node = __doeScope.global.document.createTextNode(text);
    range.insertNode(node); range.setStartAfter(node); range.collapse(true);
    selection.removeAllRanges(); selection.addRange(range);
    element.dispatchEvent(new InputEvent("input", { inputType: "insertText", data: text, bubbles: true }));
  }
