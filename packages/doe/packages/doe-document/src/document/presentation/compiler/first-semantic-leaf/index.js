import { isGroup as __doeFn_isGroup } from '../is-group/index.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:503


export function firstSemanticLeaf(node) {
    if (!node) return null;
    if (!(0, __doeFn_isGroup)(node)) return node;
    for (const child of node.children || []) {
      const leaf = (0, firstSemanticLeaf)(child);
      if (leaf) return leaf;
    }
    return null;
  }
