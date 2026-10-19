import { isGroup as __doeFn_isGroup } from '../is-group/index.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:459


export function isComposition(node) {
    return (
      (0, __doeFn_isGroup)(node) &&
      ["composition", "compressed", "auto"].includes(node.layout?.variant)
    );
  }
