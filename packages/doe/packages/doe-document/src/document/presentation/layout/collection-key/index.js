import { isCollectionGroup as __doeFn_isCollectionGroup } from '../is-collection-group/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:1697
import { scope as __doeScope } from "../../runtime/context/index.js";

export function collectionKey(node) {
    if (!node) return null;
    if ((0, __doeFn_isCollectionGroup)(node) && node.layout.collectionKey) {
      return node.layout.collectionKey;
    }
    if (node.type === "layout-group") {
      const keys = node.children.map((child) => (0, collectionKey)(child)).filter(Boolean);
      return keys.length && new Set(keys).size === 1 ? keys[0] : null;
    }
    const definition = __doeScope.components.get(node.type);
    if (!definition?.collection?.enabled) return null;
    return definition.collection.key || node.type;
  }
