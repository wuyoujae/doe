import { isGroup as __doeFn_isGroup } from '../is-group/index.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:466


export function isCollection(node) {
    return (
      (0, __doeFn_isGroup)(node) &&
      (node.kind === "collection" || Boolean(node.layout?.collectionKey))
    );
  }
