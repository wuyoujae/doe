// Origin: public/yrkie-doe/export-runtime/export-runtime.js:186


export function componentElement(slide, id) {
    return Array.from(slide.querySelectorAll("[data-component-id]")).find(
      (node) => String(node.getAttribute("data-component-id") || "") === id,
    ) || null;
  }
