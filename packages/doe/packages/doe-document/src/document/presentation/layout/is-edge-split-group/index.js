// Origin: public/yrkie-doe/layout-engine/layout-engine.js:2389


export function isEdgeSplitGroup(node) {
    return (
      node?.type === "layout-group" &&
      ["edge-media", "split-right-bleed"].includes(node.layout?.variant)
    );
  }
