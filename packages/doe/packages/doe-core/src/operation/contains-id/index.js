// Origin: public/yrkie-doe/layout-engine/layout-engine.js:1439


export function containsId(node, id) {
    if (node.id === id) return true;
    return (
      node.type === "layout-group" &&
      node.children.some((child) => (0, containsId)(child, id))
    );
  }
