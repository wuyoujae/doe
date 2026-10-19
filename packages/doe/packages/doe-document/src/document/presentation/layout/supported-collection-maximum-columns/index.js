import { firstCollectionLeaf as __doeFn_firstCollectionLeaf } from '../first-collection-leaf/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:4742
import { scope as __doeScope } from "../../runtime/context/index.js";

export function supportedCollectionMaximumColumns(node) {
    const leaf = (0, __doeFn_firstCollectionLeaf)(node, node.layout?.collectionKey || null);
    const contract = leaf ? __doeScope.components.get(leaf.type)?.collection : null;
    return Math.max(
      1,
      Math.min(
        node.children?.length || 1,
        Number(contract?.maxColumns) || 1,
      ),
    );
  }
