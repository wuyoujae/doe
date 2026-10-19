import { ancestorGroups as __doeFn_ancestorGroups } from '../ancestor-groups/index.js';
import { isEdgeSplitGroup as __doeFn_isEdgeSplitGroup } from '../is-edge-split-group/index.js';
import { isCompositionGroup as __doeFn_isCompositionGroup } from '../is-composition-group/index.js';
import { isCollectionGroup as __doeFn_isCollectionGroup } from '../is-collection-group/index.js';
import { targetShellWidth as __doeFn_targetShellWidth } from '../target-shell-width/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:2069


export function localClusterPlanningWidth(state, targetId) {
    const planningAncestor = [
      ...((0, __doeFn_ancestorGroups)(state.slide.blocks, targetId) || []),
    ]
      .reverse()
      .find(
        (group) =>
          !(0, __doeFn_isEdgeSplitGroup)(group) &&
          ((0, __doeFn_isCompositionGroup)(group) || (0, __doeFn_isCollectionGroup)(group)),
      );
    return (0, __doeFn_targetShellWidth)(state, planningAncestor?.id || targetId);
  }
