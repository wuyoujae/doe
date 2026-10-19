import { findLocation as __doeFn_findLocation } from '../../../../../../doe-core/src/operation/find-location/index.js';
import { isCompositionGroup as __doeFn_isCompositionGroup } from '../is-composition-group/index.js';
import { isCollectionGroup as __doeFn_isCollectionGroup } from '../is-collection-group/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:3673
import { scope as __doeScope } from "../../runtime/context/index.js";

export function splitCompositionGroup(state, groupId) {
    const location = (0, __doeFn_findLocation)(state.slide.blocks, groupId);
    if (
      !location ||
      (!(0, __doeFn_isCompositionGroup)(location.node) && !(0, __doeFn_isCollectionGroup)(location.node))
    ) {
      return false;
    }
    const children = location.node.children;
    if (
      (0, __doeFn_isCompositionGroup)(location.parentGroup) &&
      location.parentGroup.children.length - 1 + children.length >
        __doeScope.MAX_COMPOSITION_ITEMS
    ) {
      return false;
    }
    if (
      (0, __doeFn_isCollectionGroup)(location.parentGroup) &&
      location.parentGroup.children.length - 1 + children.length >
        (location.parentGroup.layout.maxItems || __doeScope.MAX_COLLECTION_ITEMS)
    ) {
      return false;
    }
    location.array.splice(location.index, 1, ...children);
    state.selectedId = children[0]?.id || null;
    return true;
  }
