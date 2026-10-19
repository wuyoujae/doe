// Origin: public/yrkie-doe/layout-engine/layout-engine.js:1711


export function collectionItemCount(node) {
    if (!node) return 0;
    if (node.type !== "layout-group") return 1;
    return node.children.reduce(
      (sum, child) => sum + (0, collectionItemCount)(child),
      0,
    );
  }
