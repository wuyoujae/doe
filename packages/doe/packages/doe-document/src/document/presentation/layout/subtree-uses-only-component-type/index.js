// Origin: public/yrkie-doe/layout-engine/layout-engine.js:7472


export function subtreeUsesOnlyComponentType(node, type) {
    if (!node) return false;
    if (node.type !== "layout-group") return node.type === type;
    return (
      Array.isArray(node.children) &&
      node.children.length > 0 &&
      node.children.every((child) => (0, subtreeUsesOnlyComponentType)(child, type))
    );
  }
