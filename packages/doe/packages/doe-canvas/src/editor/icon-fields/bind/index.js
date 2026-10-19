import { fields as __doeFn_fields } from '../fields/index.js';
// Origin: public/yrkie-doe/layout-engine/icon-fields.js:26


export function bind(root, node, editable, label) {
    if (!editable) return;
    for (const { target } of (0, __doeFn_fields)(root, node)) {
      target.dataset.doeIconControl = "true";
      const iconBox = target.closest(".item-cards__icon");
      if (iconBox) iconBox.dataset.doeIconControl = "true";
      target.setAttribute("draggable", "false");
      target.setAttribute("role", "button");
      target.setAttribute("tabindex", "0");
      target.setAttribute("aria-label", label || "替换");
      target.removeAttribute("aria-hidden");
      // Editable icons may live inside decorative artwork or shaped headers.
      for (let ancestor = target.parentElement; ancestor && ancestor !== root; ancestor = ancestor.parentElement) {
        if (ancestor.getAttribute("aria-hidden") === "true") ancestor.removeAttribute("aria-hidden");
      }
      target.setAttribute("focusable", "true");
      target.style.cursor = "pointer";
      // SVG stroke-only glyphs need a full hit area, including their empty centers.
      if (target.localName === "svg" && !target.querySelector(":scope > [data-doe-icon-hitbox]")) {
        const values = (target.getAttribute("viewBox") || "0 0 24 24").trim().split(/[\s,]+/).map(Number);
        const box = target.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "rect");
        for (const [key, value] of Object.entries({ x: values[0], y: values[1], width: values[2], height: values[3], fill: "transparent", stroke: "none", "pointer-events": "all", "data-doe-icon-hitbox": "true" })) box.setAttribute(key, String(value));
        target.prepend(box);
      }
    }
  }
