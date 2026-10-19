import { isCollection as __doeFn_isCollection } from '../is-collection/index.js';
import { isLocalCluster as __doeFn_isLocalCluster } from '../is-local-cluster/index.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:745


export function isAlternatingMediaTextCollection(node) {
    if (!(0, __doeFn_isCollection)(node) || (0, __doeFn_isLocalCluster)(node)) return false;
    const children = node.children || [];
    if (children.length < 4 || children.length > 12 || children.length % 2) {
      return false;
    }
    for (let index = 0; index < children.length; index += 2) {
      if (children[index]?.type !== "media" || children[index + 1]?.type !== "text") {
        return false;
      }
    }
    return true;
  }
