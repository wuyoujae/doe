// Origin: public/yrkie-doe/layout-engine/layout-engine.js:1427


export function findLocation(nodes, id, parentGroup = null) {
    for (let index = 0; index < nodes.length; index += 1) {
      const node = nodes[index];
      if (node.id === id) return { array: nodes, index, node, parentGroup };
      if (node.type === "layout-group") {
        const match = (0, findLocation)(node.children, id, node);
        if (match) return match;
      }
    }
    return null;
  }
