import { isGroup as __doeFn_isGroup } from '../is-group/index.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:494


export function semanticLeafCount(node) {
    if (!node) return 0;
    if (!(0, __doeFn_isGroup)(node)) return 1;
    return (node.children || []).reduce(
      (total, child) => total + (0, semanticLeafCount)(child),
      0,
    );
  }
