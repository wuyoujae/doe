import { isCollectionGroup as __doeFn_isCollectionGroup } from '../is-collection-group/index.js';
import { isLocalCluster as __doeFn_isLocalCluster } from '../is-local-cluster/index.js';
import { firstCollectionLeaf as __doeFn_firstCollectionLeaf } from '../first-collection-leaf/index.js';
import { isContentsGroup as __doeFn_isContentsGroup } from '../is-contents-group/index.js';
import { contentsMaximumColumns as __doeFn_contentsMaximumColumns } from '../contents-maximum-columns/index.js';
import { collectionKey as __doeFn_collectionKey } from '../collection-key/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:1733
import { scope as __doeScope } from "../../runtime/context/index.js";

export function collectionContract(node) {
    if (!node) return null;
    if ((0, __doeFn_isCollectionGroup)(node) && !(0, __doeFn_isLocalCluster)(node)) {
      const child = (0, __doeFn_firstCollectionLeaf)(node, node.layout.collectionKey || null);
      const childContract = child
        ? __doeScope.components.get(child.type)?.collection || null
        : null;
      return {
        enabled: true,
        key: node.layout.collectionKey || childContract?.key || null,
        minItemWidth: childContract?.minItemWidth || 260,
        preferredItemWidth: childContract?.preferredItemWidth || 360,
        maxColumns:
          (0, __doeFn_isContentsGroup)(node) ? (0, __doeFn_contentsMaximumColumns)(node) : Number(node.layout.maxColumns) || childContract?.maxColumns || 4,
        maxItems:
          Number(node.layout.maxItems) ||
          childContract?.maxItems ||
          __doeScope.MAX_COLLECTION_ITEMS,
      };
    }
    if (node.type === "layout-group") {
      const child = (0, __doeFn_firstCollectionLeaf)(node, (0, __doeFn_collectionKey)(node));
      return child ? __doeScope.components.get(child.type)?.collection || null : null;
    }
    return __doeScope.components.get(node.type)?.collection || null;
  }
