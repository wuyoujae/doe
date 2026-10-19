// Origin: public/yrkie-doe/layout-engine/layout-engine.js:1802


export function ancestorGroups(nodes, id, path = []) {
    for (const node of nodes) {
      if (node.id === id) return path;
      if (node.type === "layout-group") {
        const match = (0, ancestorGroups)(node.children, id, [...path, node]);
        if (match) return match;
      }
    }
    return null;
  }
