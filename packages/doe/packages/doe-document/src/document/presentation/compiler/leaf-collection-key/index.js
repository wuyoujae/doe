import { isGroup as __doeFn_isGroup } from '../is-group/index.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:522
import { scope as __doeScope } from "../runtime/context/index.js";

export function leafCollectionKey(node) {
    if (!node || (0, __doeFn_isGroup)(node)) return null;
    const contract = __doeScope.engine.components.get(node.type)?.collection || null;
    return contract?.enabled === false
      ? null
      : contract?.key || node.type || null;
  }
