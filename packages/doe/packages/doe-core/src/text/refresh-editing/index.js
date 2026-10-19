import { applyElement as __doeFn_applyElement } from '../apply-element/index.js';
// Origin: public/yrkie-doe/core/semantic-text-layout.js:539
import { scope as __doeScope } from "../layout/runtime/context/index.js";

export function refreshEditing(element, model) {
    if (!model || !element.isConnected) return;
    const plain = __doeScope.global.DOETextFields?.plainText || ((node) => node.textContent || "");
    model.update(plain(element));
    const selection = __doeScope.global.getSelection?.();
    const offset = (node, index) => {
      if (!node || !element.contains(node)) return null;
      const range = __doeScope.global.document.createRange();
      range.selectNodeContents(element); range.setEnd(node, index);
      return model.sourceOffset(plain(range.cloneContents()).length);
    };
    const anchor = selection ? offset(selection.anchorNode, selection.anchorOffset) : null;
    const focus = selection ? offset(selection.focusNode, selection.focusOffset) : null;
    element.dataset.semanticSource = model.source();
    (0, __doeFn_applyElement)(element, { editing: true });
    const projection = element.__semanticProjection;
    if (!projection || projection.text !== element.textContent) return;
    model.reset(projection);
    if (anchor !== null && focus !== null && element.firstChild?.nodeType === 3) {
      const length = element.firstChild.length;
      selection.setBaseAndExtent(element.firstChild, Math.min(length, model.displayOffset(anchor)),
        element.firstChild, Math.min(length, model.displayOffset(focus)));
    }
  }
