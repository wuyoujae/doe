import { findLocation as __doeFn_findLocation } from '../../../../../../doe-core/src/operation/find-location/index.js';
import { isEdgeSplitGroup as __doeFn_isEdgeSplitGroup } from '../is-edge-split-group/index.js';
import { containsId as __doeFn_containsId } from '../../../../../../doe-core/src/operation/contains-id/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:2578


export function edgeSplitPair(state, sourceId, targetId) {
    const source = (0, __doeFn_findLocation)(state.slide.blocks, sourceId);
    if (!source || sourceId === targetId) return null;
    if (
      !(0, __doeFn_isEdgeSplitGroup)(source.parentGroup) ||
      source.array.length !== 2
    ) {
      return null;
    }
    const targetRegion = source.parentGroup.children.find((child) =>
      (0, __doeFn_containsId)(child, targetId),
    );
    if (!targetRegion || targetRegion.id === sourceId) return null;
    const target = (0, __doeFn_findLocation)(state.slide.blocks, targetRegion.id);
    if (!target || source.array !== target.array) return null;
    return { source, target, group: source.parentGroup };
  }
