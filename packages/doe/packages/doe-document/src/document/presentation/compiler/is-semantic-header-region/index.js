import { isGroup as __doeFn_isGroup } from '../is-group/index.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:1932


export function isSemanticHeaderRegion(node) {
    return (
      node?.type === "heading" ||
      node?.type === "hero" ||
      ((0, __doeFn_isGroup)(node) && node.layout?.intent === "semantic-heading-support")
    );
  }
