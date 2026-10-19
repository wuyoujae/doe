import { collectionKey as __doeFn_collectionKey } from '../collection-key/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:1720


export function firstCollectionLeaf(node, expectedKey = null) {
    if (!node) return null;
    if (node.type !== "layout-group") {
      const key = (0, __doeFn_collectionKey)(node);
      return key && (!expectedKey || key === expectedKey) ? node : null;
    }
    for (const child of node.children) {
      const match = (0, firstCollectionLeaf)(child, expectedKey);
      if (match) return match;
    }
    return null;
  }
