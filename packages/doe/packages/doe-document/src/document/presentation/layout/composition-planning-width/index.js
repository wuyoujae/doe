import { findLocation as __doeFn_findLocation } from '../../../../../../doe-core/src/operation/find-location/index.js';
import { targetShellWidth as __doeFn_targetShellWidth } from '../target-shell-width/index.js';
import { isCompositionGroup as __doeFn_isCompositionGroup } from '../is-composition-group/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:2058


export function compositionPlanningWidth(state, targetId) {
    const target = (0, __doeFn_findLocation)(state.slide.blocks, targetId);
    if (!target) return (0, __doeFn_targetShellWidth)(state, targetId);
    const planningNode = (0, __doeFn_isCompositionGroup)(target.node)
      ? target.node
      : (0, __doeFn_isCompositionGroup)(target.parentGroup)
        ? target.parentGroup
        : target.node;
    return (0, __doeFn_targetShellWidth)(state, planningNode.id);
  }
