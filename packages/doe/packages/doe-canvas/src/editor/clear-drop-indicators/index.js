import { clearDropIndicator } from '../drop-indicator/clear/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:1613


export function clearDropIndicators(state) {
    clearDropIndicator(state.slideElement);
    if (!state.slideElement) return;
    state.layoutElement?.classList.remove("is-root-drop");
    state.slideElement
      .querySelectorAll(".root-drop-shelf.is-active")
      .forEach((node) => node.classList.remove("is-active"));
    state.slideElement
      .querySelectorAll(
        ".is-drop-before, .is-drop-after, .is-drop-compose, .is-drop-compose-left, .is-drop-compose-right, .is-drop-compose-top, .is-drop-compose-bottom, .is-drop-compose-auto, .is-drop-swap, .is-drop-rejected",
      )
      .forEach((node) => {
        node.classList.remove(
          "is-drop-before",
          "is-drop-after",
          "is-drop-compose",
          "is-drop-compose-left",
          "is-drop-compose-right",
          "is-drop-compose-top",
          "is-drop-compose-bottom",
          "is-drop-compose-auto",
          "is-drop-swap",
          "is-drop-rejected",
        );
        node.dataset.dropIntent = "";
        node.dataset.dropReason = "";
        node.dataset.dropTargetId = "";
        node.dataset.dropPlacement = "";
        node.dataset.dropDirection = "";
        node.dataset.dropLabel = "";
      });
  }
