import { firstSemanticLeaf as __doeFn_firstSemanticLeaf } from '../first-semantic-leaf/index.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:516
import { scope as __doeScope } from "../runtime/context/index.js";

export function collectionContractFor(node) {
    const leaf = (0, __doeFn_firstSemanticLeaf)(node);
    if (!leaf) return null;
    return __doeScope.engine.components.get(leaf.type)?.collection || null;
  }
