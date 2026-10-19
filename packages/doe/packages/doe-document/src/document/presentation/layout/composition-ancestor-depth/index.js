import { ancestorGroups as __doeFn_ancestorGroups } from '../ancestor-groups/index.js';
import { isCompositionGroup as __doeFn_isCompositionGroup } from '../is-composition-group/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:1813


export function compositionAncestorDepth(state, id) {
    return ((0, __doeFn_ancestorGroups)(state.slide.blocks, id) || []).filter((group) =>
      (0, __doeFn_isCompositionGroup)(group),
    ).length;
  }
