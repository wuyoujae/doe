import { isCollectionGroup as __doeFn_isCollectionGroup } from '../is-collection-group/index.js';
import { collectionKey as __doeFn_collectionKey } from '../collection-key/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:7254


export function isHomogeneousCollectionGrid(node) {
    if (!node || node.type !== "layout-group") return false;
    if ((0, __doeFn_isCollectionGroup)(node)) return true;
    if (!["grid", "auto-grid"].includes(node.layout?.variant)) return false;
    const keys = node.children.map((child) => (0, __doeFn_collectionKey)(child));
    return Boolean(
      keys.length &&
        keys.every(Boolean) &&
        new Set(keys).size === 1,
    );
  }
