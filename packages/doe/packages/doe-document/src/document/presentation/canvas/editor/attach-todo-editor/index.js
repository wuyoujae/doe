import { queueMutation as __doeFn_queueMutation } from "../transaction/queue-mutation/index.js";
import { findLocation as __doeFn_findLocation } from "../../../../../../../doe-core/src/operation/find-location/index.js";
import { isAbortError as __doeFn_isAbortError } from "../../../../../../../doe-core/src/runtime/is-abort-error/index.js";
import { notify as __doeFn_notify } from "../../../../../../../doe-core/src/operation/notify/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:6117


export function attachTodoEditor(root, node, state) {
    if (node.type !== "todo-list" || !state.slide.editor) return;
    root.querySelectorAll("[data-todo-index]").forEach(button => {
      const index = Number(button.dataset.todoIndex);
      button.addEventListener("pointerdown", event => {
        event.stopPropagation();
        // Commit explicitly on click so blur cannot rebuild away the click target.
        if (state.activeTextEdit) event.preventDefault();
      });
      button.addEventListener("dragstart", event => { event.preventDefault(); event.stopPropagation(); });
      button.addEventListener("click", async event => {
        event.stopPropagation();
        const restoreFocus = document.activeElement === button;
        button.disabled = true;
        try {
          await state.activeTextEdit?.finish?.(true);
          if (state.activeTextEdit && !state.activeTextEdit.finished) return;
          await (0, __doeFn_queueMutation)(state, "切换待办状态", () => {
            const current = (0, __doeFn_findLocation)(state.slide.blocks, node.id)?.node;
            const item = current?.props?.items?.[index];
            if (!item) return false;
            item.checked = item.checked !== true;
            state.selectedId = node.id;
            return true;
          });
          if (restoreFocus && document.activeElement === document.body) {
            state.leafRecords.find(record => record.node.id === node.id)?.element.querySelector(`[data-todo-index="${index}"]`)?.focus({ preventScroll: true });
          }
        } catch (error) {
          if (!(0, __doeFn_isAbortError)(error)) {
            state.runtimeDiagnostics.push({ level: "warning", code: "todo-update-failed", message: error.message });
            (0, __doeFn_notify)(state, { rejected: true, action: "切换待办状态", reason: error.message });
          }
        } finally { button.disabled = false; }
      });
    });
  }
