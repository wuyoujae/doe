import { findLocation as __doeFn_findLocation } from '../../../../../../doe-core/src/operation/find-location/index.js';
import { isCompositionGroup as __doeFn_isCompositionGroup } from '../is-composition-group/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:3705


export function updateCompositionLayout(state, groupId, updates) {
    const location = (0, __doeFn_findLocation)(state.slide.blocks, groupId);
    if (!location || !(0, __doeFn_isCompositionGroup)(location.node)) return false;
    Object.assign(location.node.layout, updates);
    if (updates.direction) {
      location.node.layout.columns =
        updates.direction === "row" ? location.node.children.length : 1;
    }
    state.selectedId = groupId;
    return true;
  }
