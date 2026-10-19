import { insertEditingText as __doeFn_insertEditingText } from '../insert-editing-text/index.js';
// Origin: public/yrkie-doe/core/semantic-text-layout.js:478
import { scope as __doeScope } from "../layout/runtime/context/index.js";

export function bindEditingHistory(element, model, signal) {
    if (!model || element.dataset.semanticRender !== "plaintext") return;
    const undo = []; const redo = [];
    let composing = false; let replaying = false; let pending = null;
    const capture = () => {
      model.update(__doeScope.global.DOETextFields?.plainText(element) ?? element.textContent ?? "");
      const selection = __doeScope.global.getSelection();
      const offset = (node, index) => {
        if (!node || !element.contains(node)) return 0;
        const range = __doeScope.global.document.createRange();
        range.selectNodeContents(element); range.setEnd(node, index);
        return (__doeScope.global.DOETextFields?.plainText(range.cloneContents()) ?? range.toString()).length;
      };
      return { projection: model.snapshot(), source: model.source(), anchor: offset(selection?.anchorNode, selection?.anchorOffset),
        focus: offset(selection?.focusNode, selection?.focusOffset) };
    };
    let previous = capture();
    const record = () => {
      if (composing || replaying) return;
      const current = capture();
      if (current.source !== previous.source) {
        undo.push(pending || previous); if (undo.length > 100) undo.shift(); redo.length = 0;
      }
      previous = current; pending = null;
    };
    const restore = (from, to) => {
      if (!from.length) return;
      to.push(capture());
      const entry = from.pop();
      model.reset(entry.projection);
      element.textContent = entry.projection.text;
      element.__semanticProjection = entry.projection;
      element.dataset.semanticSource = model.source();
      if (element.firstChild) __doeScope.global.getSelection()?.setBaseAndExtent(element.firstChild, entry.anchor, element.firstChild, entry.focus);
      // Existing input handlers refresh layout and live-fit using this source.
      replaying = true;
      element.dispatchEvent(new Event("input", { bubbles: true }));
      replaying = false; pending = null; previous = capture();
    };
    element.addEventListener("beforeinput", (event) => {
      if (!composing && (event.inputType === "insertParagraph" || event.inputType === "insertLineBreak")) {
        // Native plaintext editors may append a second LF/BR as a caret
        // placeholder at the end. Insert exactly the author's one newline.
        event.preventDefault(); (0, __doeFn_insertEditingText)(element, "\n");
      } else if (event.inputType === "historyUndo" || event.inputType === "historyRedo") {
        event.preventDefault();
        if (event.inputType === "historyUndo") restore(undo, redo); else restore(redo, undo);
      } else if (!composing && !event.isComposing && event.inputType !== "insertFromComposition") pending = capture();
    }, { signal });
    element.addEventListener("input", record, { signal });
    element.addEventListener("compositionstart", () => { pending = capture(); composing = true; }, { signal });
    element.addEventListener("compositionend", () => { composing = false; record(); }, { signal });
    element.addEventListener("keydown", (event) => {
      if (composing || event.isComposing || !(event.ctrlKey || event.metaKey) || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key !== "z" && key !== "y") return;
      event.preventDefault(); event.stopPropagation();
      if (key === "y" || event.shiftKey) restore(redo, undo); else restore(undo, redo);
    }, { signal });
  }
