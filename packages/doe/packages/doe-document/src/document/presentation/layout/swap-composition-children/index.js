import { findLocation as __doeFn_findLocation } from '../../../../../../doe-core/src/operation/find-location/index.js';
import { isCompositionGroup as __doeFn_isCompositionGroup } from '../is-composition-group/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:3717


export function swapCompositionChildren(state, groupId) {
    const location = (0, __doeFn_findLocation)(state.slide.blocks, groupId);
    if (!location || !(0, __doeFn_isCompositionGroup)(location.node)) return false;
    location.node.children.reverse();
    state.selectedId = groupId;
    return true;
  }
