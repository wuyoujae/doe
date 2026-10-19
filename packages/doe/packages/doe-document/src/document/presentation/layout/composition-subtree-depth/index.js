import { isCompositionGroup as __doeFn_isCompositionGroup } from '../is-composition-group/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:1793


export function compositionSubtreeDepth(node) {
    if (!node || node.type !== "layout-group") return 0;
    const childDepth = Math.max(
      0,
      ...node.children.map((child) => (0, compositionSubtreeDepth)(child)),
    );
    return childDepth + ((0, __doeFn_isCompositionGroup)(node) ? 1 : 0);
  }
