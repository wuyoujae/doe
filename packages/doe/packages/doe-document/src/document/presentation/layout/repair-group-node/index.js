import { findLocation as __doeFn_findLocation } from '../../../../../../doe-core/src/operation/find-location/index.js';
import { isCompositionGroup as __doeFn_isCompositionGroup } from '../is-composition-group/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:8662


export function repairGroupNode(state, id) {
    const location = (0, __doeFn_findLocation)(state.slide.blocks, id);
    return location && (0, __doeFn_isCompositionGroup)(location.node) ? location : null;
  }
