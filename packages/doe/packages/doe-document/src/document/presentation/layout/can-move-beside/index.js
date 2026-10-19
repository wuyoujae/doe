import { findLocation as __doeFn_findLocation } from '../../../../../../doe-core/src/operation/find-location/index.js';
import { ancestorGroups as __doeFn_ancestorGroups } from '../ancestor-groups/index.js';
import { isEdgeSplitGroup as __doeFn_isEdgeSplitGroup } from '../is-edge-split-group/index.js';
import { isCollectionGroup as __doeFn_isCollectionGroup } from '../is-collection-group/index.js';
import { collectionKey as __doeFn_collectionKey } from '../collection-key/index.js';
import { isCompressionGroup as __doeFn_isCompressionGroup } from '../is-compression-group/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:2362
import { scope as __doeScope } from "../../runtime/context/index.js";

export function canMoveBeside(state, sourceId, targetId) {
    const source = (0, __doeFn_findLocation)(state.slide.blocks, sourceId);
    const target = (0, __doeFn_findLocation)(state.slide.blocks, targetId);
    if (!source || !target) return false;
    if (
      [sourceId, targetId].some((id) =>
        ((0, __doeFn_ancestorGroups)(state.slide.blocks, id) || []).some((group) =>
          (0, __doeFn_isEdgeSplitGroup)(group),
        ),
      )
    ) {
      return false;
    }
    if ((0, __doeFn_isCollectionGroup)(target.parentGroup)) {
      const expectedKey = (0, __doeFn_collectionKey)(target.parentGroup);
      if (!expectedKey || (0, __doeFn_collectionKey)(source.node) !== expectedKey) return false;
    }
    if (
      (0, __doeFn_isCompressionGroup)(target.parentGroup) &&
      source.array !== target.array &&
      target.parentGroup.children.length >= __doeScope.MAX_COMPOSITION_ITEMS
    ) {
      return false;
    }
    return true;
  }
