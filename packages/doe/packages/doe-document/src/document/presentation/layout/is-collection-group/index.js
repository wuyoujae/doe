// Origin: public/yrkie-doe/layout-engine/layout-engine.js:1683


export function isCollectionGroup(node) {
    return (
      node?.type === "layout-group" &&
      (node.kind === "collection" || Boolean(node.layout?.collectionKey))
    );
  }
