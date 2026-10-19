// Origin: public/yrkie-doe/layout-engine/layout-engine.js:1690


export function isLocalCluster(node) {
    return (
      node?.type === "layout-group" &&
      (node.kind === "cluster" || node.layout?.cluster === true)
    );
  }
