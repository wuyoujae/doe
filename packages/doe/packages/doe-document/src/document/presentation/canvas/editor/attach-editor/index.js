import { attachGroupingDrag } from '../grouping-drag/index.js';
import { attachSelectionOutline } from '../../../../../../../doe-canvas/src/editor/selection-outline/index.js';
import { isEdgeSplitGroup as __doeFn_isEdgeSplitGroup } from "../../../layout/is-edge-split-group/index.js";
import { element as __doeFn_element } from "../../../../../../../doe-core/src/runtime/element/index.js";
import { findLocation as __doeFn_findLocation } from "../../../../../../../doe-core/src/operation/find-location/index.js";
import { updateSelection as __doeFn_updateSelection } from "../update-selection/index.js";
import { directTextEditEnabled as __doeFn_directTextEditEnabled } from "../../../../../../../doe-canvas/src/editor/direct-text-edit-enabled/index.js";
import { textEditContract as __doeFn_textEditContract } from "../../../layout/text-edit-contract/index.js";
import { beginInlineTextEdit as __doeFn_beginInlineTextEdit } from "../begin-inline-text-edit/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:3725
import { scope as __doeScope } from "../../../runtime/context/index.js";

export function attachEditor(shell, node, state) {
    shell.dataset.blockId = node.id;
    shell.classList.add("block-shell");
    if (state.selectedId === node.id) shell.classList.add("is-selected");
    if (!state.slide.editor) return;
    attachSelectionOutline(shell);

    if (
      ["content", "media"].includes(node.layout?.region) ||
      (0, __doeFn_isEdgeSplitGroup)(node)
    ) {
      const selectionOverlay = (0, __doeFn_element)(
        "span",
        "edge-region-selection-overlay",
      );
      selectionOverlay.dataset.editorOverlay = "true";
      selectionOverlay.setAttribute("aria-hidden", "true");
      shell.append(selectionOverlay);
    }

    shell.draggable = false;
    const dragScope = node.type === "layout-group" ? "group" : "element";
    const handle = (0, __doeFn_element)(
      "button",
      `block-handle block-handle--${dragScope}`,
    );
    handle.type = "button";
    handle.draggable = false;
    handle.dataset.dragScope = dragScope;
    handle.setAttribute(
      "aria-label",
      dragScope === "group" ? `拖动整个组合 ${node.id}` : `拖动元素 ${node.id}`,
    );
    handle.title = dragScope === "group" ? "拖动整个组合" : "拖动当前元素";
    const gripIconName =
      dragScope === "element" ? "MoreHorizontal" : "GripVertical";
    const gripIconData =
      __doeScope.global.lucide?.icons?.[gripIconName] || __doeScope.global.lucide?.[gripIconName];
    // A nested SVG can become Chromium's native drag source instead of the
    // component grip (especially inside the scaled Work iframe). Keep the
    // button as the only draggable hit target and paint the icon on it.
    handle.dataset.gripIcon = dragScope === "element" ? "horizontal" : "vertical";
    if (gripIconData && typeof __doeScope.global.lucide?.createElement === "function") {
      handle.setAttribute("data-has-lucide-icon", "true");
    }
    const armBlockDrag = (event) => {
      event.stopPropagation();
      state.selectedId = node.id; state.selectedItem = null;
      handle.focus({ preventScroll: true });
      (0, __doeFn_updateSelection)(state);
      shell.dataset.dragReady = "true";
    };
    // Pointer Events are the primary path. Mouse/touch fallbacks keep the
    // handle usable in embedded WebViews whose native HTML drag pipeline does
    // not always synthesize pointerdown before dragstart.
    handle.addEventListener("pointerdown", armBlockDrag);
    handle.addEventListener("mousedown", armBlockDrag);
    handle.addEventListener("touchstart", armBlockDrag, { passive: true });
    attachGroupingDrag(handle, shell, { blockId: node.id }, state);
    handle.addEventListener("click", (event) => {
      event.stopPropagation();
      handle.focus({ preventScroll: true });
      state.selectedId = node.id;
      if (!event.target.closest("[data-item-selection-key]")) state.selectedItem = null;
      (0, __doeFn_updateSelection)(state);
    });
    let handleExitTimer = 0;
    const keepHandleReachable = () => {
      __doeScope.global.clearTimeout(handleExitTimer);
      shell.classList.add("is-handle-hovered");
    };
    const releaseHandleAfterGrace = () => {
      __doeScope.global.clearTimeout(handleExitTimer);
      handleExitTimer = __doeScope.global.setTimeout(() => {
        shell.classList.remove("is-handle-hovered");
      }, 240);
    };
    shell.addEventListener("pointerenter", keepHandleReachable);
    shell.addEventListener("pointerleave", releaseHandleAfterGrace);
    handle.addEventListener("pointerenter", keepHandleReachable);
    handle.addEventListener("pointerleave", releaseHandleAfterGrace);
    handle.addEventListener("focus", keepHandleReachable);
    handle.addEventListener("blur", releaseHandleAfterGrace);
    const cancelDragReady = () => {
      if (!state.dragId) shell.dataset.dragReady = "false";
    };
    handle.addEventListener("pointerup", cancelDragReady);
    handle.addEventListener("pointercancel", cancelDragReady);
    shell.prepend(handle);
    shell.addEventListener("pointerdown", async (event) => {
      if (document.documentElement.dataset.doeDirectTextEdit !== "true") return;
      if (event.button !== 0 || event.target.closest(".block-shell") !== shell) return;
      if (event.target.closest(".block-toolbar, .block-handle")) return;
      state.selectedId = node.id;
      if (!event.target.closest("[data-item-selection-key]")) state.selectedItem = null;
      (0, __doeFn_updateSelection)(state);
      const pointedField = event.target.closest("[data-doe-text-path]") ||
        Array.from(shell.querySelectorAll("svg [data-doe-text-path]")).find((candidate) => {
          const rect = candidate.getBoundingClientRect();
          return event.clientX >= rect.left && event.clientX <= rect.right &&
            event.clientY >= rect.top && event.clientY <= rect.bottom;
        });
      const fieldPath = pointedField?.dataset.doeTextPath;
      if ((!pointedField && !(0, __doeFn_directTextEditEnabled)(node)) || state.activeTextEdit?.target.contains(event.target)) return;
      event.preventDefault();
      await state.activeTextEdit?.finish?.(true);
      if (state.activeTextEdit && !state.activeTextEdit.finished) return;
      await state.queue;
      if (!state.slideElement?.isConnected || state.selectedId !== node.id) return;
      const currentShell = Array.from(state.slideElement.querySelectorAll(".block-shell"))
        .find((candidate) => candidate.dataset.blockId === node.id);
      const currentNode = (0, __doeFn_findLocation)(state.slide.blocks, node.id)?.node;
      if (currentShell && currentNode) {
        const field = fieldPath && Array.from(currentShell.querySelectorAll("[data-doe-text-path]"))
          .find((candidate) => candidate.dataset.doeTextPath === fieldPath)?.__doeTextField;
        const contract = currentNode.type === "text" && (!field || field.path.join(".") === "text")
          ? (0, __doeFn_textEditContract)(currentNode) : field;
        if (contract) (0, __doeFn_beginInlineTextEdit)(currentShell, currentNode, state, contract, event);
      }
    });

    shell.addEventListener("click", (event) => {
      if (event.target.closest(".block-toolbar")) return;
      event.stopPropagation();
      state.selectedId = node.id;
      if (!event.target.closest("[data-item-selection-key]")) state.selectedItem = null;
      (0, __doeFn_updateSelection)(state);
    });

  }
