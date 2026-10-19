import { isCollectionGroup as __doeFn_isCollectionGroup } from '../is-collection-group/index.js';
import { subtreeUsesOnlyComponentType as __doeFn_subtreeUsesOnlyComponentType } from '../subtree-uses-only-component-type/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:7482


export function needsEqualHeightNegotiation(group) {
    if (!group?.node?.children || group.node.children.length < 2) return false;
    if ((0, __doeFn_isCollectionGroup)(group.node)) return true;
    // Question cards are frequently authored as an explicit row/stack instead
    // of an implicit collection. They still form one visual cohort and must
    // share the tallest natural card height.
    return group.node.children.every((child) =>
      (0, __doeFn_subtreeUsesOnlyComponentType)(child, "question-card"),
    );
  }
