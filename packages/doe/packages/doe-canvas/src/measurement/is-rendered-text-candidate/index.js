// Origin: public/yrkie-doe/layout-engine/layout-engine.js:8080


export function isRenderedTextCandidate(node, boundary) {
    if (!(node instanceof Element)) return false;
    const hidden = node.closest('[hidden], [aria-hidden="true"]');
    // A read-only staging host is hidden from accessibility while the slide is
    // measured. Only hidden content inside the slide affects its layout.
    if (hidden && (!boundary || boundary.contains(hidden))) return false;
    const style = getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") return false;
    return node.getClientRects().length > 0;
  }
