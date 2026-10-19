import { isGroup as __doeFn_isGroup } from '../is-group/index.js';
import { leafCollectionKey as __doeFn_leafCollectionKey } from '../leaf-collection-key/index.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:533


export function collectionMembershipKey(node) {
    if (!node) return null;
    if (!(0, __doeFn_isGroup)(node)) return (0, __doeFn_leafCollectionKey)(node);
    const children = node.children || [];
    if (!children.length) return null;
    const keys = children.map((child) => (0, collectionMembershipKey)(child));
    if (keys.some((key) => !key) || new Set(keys).size !== 1) return null;
    const inferred = keys[0];
    const declared = node.layout?.collectionKey || null;
    return declared && declared !== inferred ? null : declared || inferred;
  }
