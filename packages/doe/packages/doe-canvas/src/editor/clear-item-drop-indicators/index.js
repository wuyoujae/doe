import { clearDropIndicator } from '../drop-indicator/clear/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:5898


export function clearItemDropIndicators(root) {
    clearDropIndicator(root);
    root
      .querySelectorAll(
        ".is-item-drop-before, .is-item-drop-after, .is-item-drop-grid",
      )
      .forEach((item) =>
        item.classList.remove(
          "is-item-drop-before",
          "is-item-drop-after",
          "is-item-drop-grid",
        ),
      );
    root.querySelectorAll(".is-item-drag-active").forEach((surface) => {
      surface.classList.remove("is-item-drag-active");
      surface.dataset.itemDropLabel = "";
    });
  }
