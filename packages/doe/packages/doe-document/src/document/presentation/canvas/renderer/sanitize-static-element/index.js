// Origin: public/yrkie-doe/layout-engine/layout-engine.js:198
import { scope as __doeScope } from "../../../runtime/context/index.js";

export function sanitizeStaticElement(element) {
    if (!element || typeof element.querySelectorAll !== "function") {
      throw new TypeError("SlideEngine.sanitizeStaticElement: 需要有效的 DOM 元素。");
    }
    element
      .querySelectorAll(__doeScope.STATIC_EDITOR_REMOVE_SELECTOR)
      .forEach((node) => node.remove());
    const nodes = [element, ...element.querySelectorAll("*")];
    nodes.forEach((node) => {
      __doeScope.STATIC_INTERACTION_ATTRIBUTES.forEach((attribute) => {
        node.removeAttribute(attribute);
      });
      node.classList?.remove(...__doeScope.STATIC_EDITOR_CLASSES);
      node.classList?.remove("is-item-selected", "has-selected-item", "has-item-selection", "has-selection-outline", "doe-selectable-item", "has-insertion-indicator");
      node.classList?.remove("is-chart-active");
      node.removeAttribute("data-chart-active");
      if (node.classList?.contains("doe-chart-mark")) { node.removeAttribute("tabindex"); node.removeAttribute("aria-describedby"); }
      if (node.getAttribute("aria-describedby") === "doe-chart-tooltip") node.removeAttribute("aria-describedby");
      node.removeAttribute("data-doe-icon-control");
      node.removeAttribute("data-item-owner-id");
      node.removeAttribute("data-item-selection-key");
      node.removeAttribute("data-grouping-preview");
      node.removeAttribute("data-drop-label");
      node.removeAttribute("data-drop-intent");
      node.removeAttribute("data-drop-reason");
      node.removeAttribute("data-item-drop-label");
      node.removeAttribute("data-live-fit-font-pt");
      node.removeAttribute("data-live-fit-overflow");
      node.removeAttribute("data-semantic-editing");
    });
    const slideElement = element.matches?.(".schema-slide")
      ? element
      : element.querySelector(".schema-slide");
    if (slideElement) { slideElement.dataset.editor = "false"; slideElement.dataset.canvasMode = "static"; slideElement.inert = true; }
    element.inert = true; element.dataset.canvasMode = 'static';
    return element;
  }
