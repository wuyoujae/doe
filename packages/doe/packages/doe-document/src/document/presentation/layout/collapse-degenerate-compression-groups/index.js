import { isCompressionGroup as __doeFn_isCompressionGroup } from '../is-compression-group/index.js';
import { isCollectionGroup as __doeFn_isCollectionGroup } from '../is-collection-group/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:2902


export function collapseDegenerateCompressionGroups(nodes) {
    for (let index = nodes.length - 1; index >= 0; index -= 1) {
      const node = nodes[index];
      if (node.type !== "layout-group") continue;
      (0, collapseDegenerateCompressionGroups)(node.children);
      if (
        !(0, __doeFn_isCompressionGroup)(node) &&
        !((0, __doeFn_isCollectionGroup)(node) && node.layout?.origin !== "explicit")
      ) {
        continue;
      }
      if (node.children.length === 1) nodes.splice(index, 1, node.children[0]);
      else if (node.children.length === 0) nodes.splice(index, 1);
    }
  }
