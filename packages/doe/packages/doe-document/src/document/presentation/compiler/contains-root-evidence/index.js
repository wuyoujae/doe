import { isGroup as __doeFn_isGroup } from '../is-group/index.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:1926
import { scope as __doeScope } from "../runtime/context/index.js";

export function containsRootEvidence(node) {
    if (!node) return false;
    if (!(0, __doeFn_isGroup)(node)) return __doeScope.ROOT_EVIDENCE_TYPES.has(node.type);
    return (node.children || []).some(containsRootEvidence);
  }
