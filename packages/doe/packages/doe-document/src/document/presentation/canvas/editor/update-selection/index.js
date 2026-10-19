import { syncSelectionOutlines } from '../../../../../../../doe-canvas/src/editor/selection-outline/index.js';
import { syncItemSelection } from '../item-selection/state/index.js';
import { positionSelectedTextToolbars as __doeFn_positionSelectedTextToolbars } from "../position-selected-text-toolbars/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:1447


export function updateSelection(state) {
    if (!state.slideElement) return;
    state.slideElement.querySelectorAll(".block-shell").forEach((node) => {
      node.classList.toggle(
        "is-selected",
        node.dataset.blockId === state.selectedId,
      );
    });
    syncItemSelection(state);
    syncSelectionOutlines(state.slideElement);
    (0, __doeFn_positionSelectedTextToolbars)(state);
    state.host.dispatchEvent(new CustomEvent("slideengine:selectionchange", { detail: { selectedId: state.selectedId, selectedItem: state.selectedItem ? { ...state.selectedItem } : null } }));
  }
