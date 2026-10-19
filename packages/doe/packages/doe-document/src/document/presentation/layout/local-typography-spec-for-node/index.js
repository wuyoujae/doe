import { findLocation as __doeFn_findLocation } from '../../../../../../doe-core/src/operation/find-location/index.js';
import { ancestorGroups as __doeFn_ancestorGroups } from '../ancestor-groups/index.js';
import { isLayoutFeatureLocked as __doeFn_isLayoutFeatureLocked } from '../is-layout-feature-locked/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:7432


export function localTypographySpecForNode(state, nodeId) {
    const node = (0, __doeFn_findLocation)(state.slide.blocks, nodeId)?.node;
    const parents = (0, __doeFn_ancestorGroups)(state.slide.blocks, nodeId) || [];
    if ([node, ...parents].some((item) => item && (0, __doeFn_isLayoutFeatureLocked)(item, "typography"))) {
      return "comfortable";
    }
    if (state.localDensities?.has(nodeId)) {
      return state.localDensities.get(nodeId);
    }
    const ancestors = (0, __doeFn_ancestorGroups)(state.slide.blocks, nodeId) || [];
    for (let index = ancestors.length - 1; index >= 0; index -= 1) {
      if (state.localDensities?.has(ancestors[index].id)) {
        return state.localDensities.get(ancestors[index].id);
      }
    }
    return null;
  }
