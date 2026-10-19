import { collectionMembershipKey as __doeFn_collectionMembershipKey } from '../collection-membership-key/index.js';
import { isCollection as __doeFn_isCollection } from '../is-collection/index.js';
import { isLocalCluster as __doeFn_isLocalCluster } from '../is-local-cluster/index.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:545


export function collectionKeyFor(node) {
    const membershipKey = (0, __doeFn_collectionMembershipKey)(node);
    if (membershipKey) return membershipKey;
    return (0, __doeFn_isCollection)(node) && !(0, __doeFn_isLocalCluster)(node)
      ? node.layout?.collectionKey || null
      : null;
  }
