// Origin: public/yrkie-doe/layout-engine/layout-engine.js:8073


export function hasDirectText(node) {
    return [...node.childNodes].some(
      (child) =>
        child.nodeType === 3 && String(child.textContent || "").trim().length,
    );
  }
