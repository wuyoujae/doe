import { attachGroupingDrag } from '../grouping-drag/index.js';
import { groupingCollection } from '../../../../../../../doe-component/src/component/contents/contents/model/grouping/index.js';
import { showDropIndicator } from '../../../../../../../doe-canvas/src/editor/drop-indicator/show/index.js';
import { findLocation } from '../../../../../../../doe-core/src/operation/find-location/index.js';
import { attachItemSelection } from '../item-selection/attach/index.js';
import { itemKey } from '../item-selection/state/index.js';
import { itemCollectionValues as __doeFn_itemCollectionValues } from "../../../layout/item-collection-values/index.js";
import { clearItemDropIndicators as __doeFn_clearItemDropIndicators } from "../../../../../../../doe-canvas/src/editor/clear-item-drop-indicators/index.js";
import { queueMutation as __doeFn_queueMutation } from "../transaction/queue-mutation/index.js";
import { reorderCollectionItems as __doeFn_reorderCollectionItems } from "../../../layout/reorder-collection-items/index.js";
import { setItemCollectionValues as __doeFn_setItemCollectionValues } from "../../../layout/set-item-collection-values/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:5916


export function attachItemCollectionEditor(root, node, definition, state) {
    const contract = definition.resolveItemCollection?.(node.props) || definition.itemCollection;
    const values = (0, __doeFn_itemCollectionValues)(node, definition);
    if (
      !state.slide.editor ||
      !contract ||
      contract.reorderable === false ||
      !values?.length
    ) {
      return;
    }
    const fixedLayout = contract.fixedLayout === true;
    const verticalOrder = fixedLayout || Number(contract.maxColumns) === 1 || root.matches('.component-list');
    const items = [
      ...root.querySelectorAll("[data-collection-item-index]"),
    ];
    const collectionSurface = items[0]?.parentElement || root;
    items.forEach((item) => {
      if (item.dataset.itemEditorAttached === "true") return;
      item.dataset.itemEditorAttached = "true";
      const index = Number(item.dataset.collectionItemIndex);
      const selectable = node.type !== "table" && definition.category !== "charts" && attachItemSelection(item, node, values[index], index, state);
      if (selectable && groupingCollection(node)) {
        item.draggable = false;
        item.setAttribute('aria-label', `内容项 ${index + 1}，拖动换序、拆分或合入`);
        attachGroupingDrag(item.querySelector('.doe-item-handle'), item, { blockId: node.id, index, ...(values[index]?.id ? { itemId: values[index].id } : {}) }, state);
        return;
      }
      item.draggable = !fixedLayout && !selectable;
      item.setAttribute("draggable", String(!fixedLayout && !selectable));
      item.setAttribute("aria-label", `内部项目 ${index + 1}，可拖动换序`);
      item.addEventListener("dragstart", (event) => {
        event.stopPropagation();
        state.itemDrag = { nodeId: node.id, index };
        state.itemDropIntent = null;
        item.classList.add("is-item-dragging");
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", `${node.id}:${index}`);
        }
      });
      item.addEventListener("dragover", (event) => {
        if (state.itemDrag?.nodeId !== node.id) return;
        event.preventDefault();
        event.stopPropagation();
        if (state.itemDrag.index === index) {
          (0, __doeFn_clearItemDropIndicators)(root); state.itemDropIntent = null; return;
        }
        const rect = item.getBoundingClientRect();
        const relativeX = (event.clientX - rect.left) / Math.max(1, rect.width);
        const relativeY = (event.clientY - rect.top) / Math.max(1, rect.height);
        // Dragging only reorders. Column changes belong to layout negotiation or toolbar actions.
        const before = fixedLayout ? state.itemDrag.index > index : (verticalOrder ? relativeY : relativeX) <= 0.5;
        (0, __doeFn_clearItemDropIndicators)(root);
        collectionSurface.classList.add("is-item-drag-active");
        collectionSurface.dataset.itemDropLabel = "松开：仅换序";
        item.classList.add(
          before ? "is-item-drop-before" : "is-item-drop-after",
        );
        showDropIndicator(item, verticalOrder ? (before ? "top" : "bottom") : (before ? "left" : "right"));
        state.itemDropIntent = {
          nodeId: node.id,
          targetIndex: index,
          before,
          fixedLayout,
        };
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      });
      item.addEventListener("drop", (event) => {
        const drag = state.itemDrag;
        const intent = state.itemDropIntent;
        if (!drag || drag.nodeId !== node.id || intent?.nodeId !== node.id) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        (0, __doeFn_clearItemDropIndicators)(root);
        state.itemDrag = null;
        state.itemDropIntent = null;
        const edit = state.activeTextEdit;
        edit?.finish?.(true);
        if (edit && !edit.finished) return;
        (0, __doeFn_queueMutation)(state, "重排列表项", () => {
          const currentNode = findLocation(state.slide.blocks, node.id)?.node;
          if (!currentNode) return false;
          const current = (0, __doeFn_itemCollectionValues)(currentNode, definition);
          if (!current || drag.index < 0 || drag.index >= current.length) {
            return false;
          }
          const next = (0, __doeFn_reorderCollectionItems)(
            current,
            drag.index,
            intent.targetIndex,
            intent,
          );
          if (!next) return false;
          const order = (0, __doeFn_reorderCollectionItems)(current.map((_, i) => i), drag.index, intent.targetIndex, intent);
          if (state.selectedItem?.blockId === node.id) {
            const selectedIndex = order.indexOf(state.selectedItem.index);
            if (selectedIndex >= 0) state.selectedItem = { blockId: node.id, key: itemKey(next[selectedIndex], selectedIndex), index: selectedIndex };
          }
          (0, __doeFn_setItemCollectionValues)(currentNode, definition, next, order);
          state.selectedId = node.id;
          return true;
        });
      });
      item.addEventListener("dragend", (event) => {
        event.stopPropagation();
        item.classList.remove("is-item-dragging");
        (0, __doeFn_clearItemDropIndicators)(root);
        state.itemDrag = null;
        state.itemDropIntent = null;
      });
      if (fixedLayout || selectable) {
        if (!selectable) item.style.touchAction = "none";
        item.addEventListener(selectable ? "pointerdown" : "mousedown", (event) => {
          if (selectable && !event.target.closest(".doe-item-handle")) return;
          if (event.button !== 0) return;
          event.preventDefault();
          event.stopPropagation();
          state.itemDragCleanup?.();
          const startX = event.clientX;
          const startY = event.clientY;
          let active = false;
          const cleanup = () => {
            if (state.itemDragCleanup === cancel) state.itemDragCleanup = null;
            document.removeEventListener(selectable ? "pointermove" : "mousemove", move);
            document.removeEventListener(selectable ? "pointerup" : "mouseup", finish);
            if (selectable) document.removeEventListener("pointercancel", finish);
          };
          const targetAt = (clientX, clientY) => {
            const candidate = document
              .elementFromPoint(clientX, clientY)
              ?.closest("[data-collection-item-index]");
            return candidate && root.contains(candidate) ? candidate : null;
          };
          const cancel = () => {
            cleanup();
            item.classList.remove("is-item-dragging");
            (0, __doeFn_clearItemDropIndicators)(root);
            state.itemDrag = null; state.itemDropIntent = null;
          };
          const move = (pointerEvent) => {
            if (state.disposed || !item.isConnected) { cancel(); return; }
            const distance = Math.hypot(
              pointerEvent.clientX - startX,
              pointerEvent.clientY - startY,
            );
            if (!active && distance < 6) return;
            if (!active) {
              active = true;
              state.itemDrag = { nodeId: node.id, index };
              state.itemDropIntent = null;
              item.classList.add("is-item-dragging");
            }
            pointerEvent.preventDefault();
            const targetItem = targetAt(pointerEvent.clientX, pointerEvent.clientY);
            if (!targetItem) {
              (0, __doeFn_clearItemDropIndicators)(root); state.itemDropIntent = null; return;
            }
            targetItem.dispatchEvent(
              new MouseEvent("dragover", {
                bubbles: true,
                cancelable: true,
                clientX: pointerEvent.clientX,
                clientY: pointerEvent.clientY,
              }),
            );
          };
          const finish = (pointerEvent) => {
            cleanup();
            if (active && pointerEvent.type !== "pointercancel") {
              const targetItem = targetAt(pointerEvent.clientX, pointerEvent.clientY);
              if (targetItem) {
                targetItem.dispatchEvent(
                  new MouseEvent("drop", {
                    bubbles: true,
                    cancelable: true,
                    clientX: pointerEvent.clientX,
                    clientY: pointerEvent.clientY,
                  }),
                );
              }
            }
            item.classList.remove("is-item-dragging");
            (0, __doeFn_clearItemDropIndicators)(root);
            if (state.itemDrag?.nodeId === node.id) state.itemDrag = null;
            if (state.itemDropIntent?.nodeId === node.id) state.itemDropIntent = null;
          };
          state.itemDragCleanup = cancel;
          document.addEventListener(selectable ? "pointermove" : "mousemove", move, { passive: false });
          document.addEventListener(selectable ? "pointerup" : "mouseup", finish);
          if (selectable) document.addEventListener("pointercancel", finish);
        });
      }
    });
  }
