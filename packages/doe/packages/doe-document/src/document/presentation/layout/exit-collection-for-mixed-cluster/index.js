import { findLocation as __doeFn_findLocation } from '../../../../../../doe-core/src/operation/find-location/index.js';
import { isCollectionGroup as __doeFn_isCollectionGroup } from '../is-collection-group/index.js';
import { isLocalCluster as __doeFn_isLocalCluster } from '../is-local-cluster/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:3229
import { scope as __doeScope } from "../../runtime/context/index.js";

export function exitCollectionForMixedCluster(state, collectionId) {
    if (!collectionId) return false;
    const location = (0, __doeFn_findLocation)(state.slide.blocks, collectionId);
    if (!location || !(0, __doeFn_isCollectionGroup)(location.node) || (0, __doeFn_isLocalCluster)(location.node)) {
      return false;
    }
    location.node.kind = "container";
    location.node.layout.variant = "composition";
    location.node.layout.direction = "auto";
    location.node.layout.columns = "auto";
    location.node.layout.maxColumns = __doeScope.MAX_COMPOSITION_ITEMS;
    location.node.layout.collectionKey = null;
    location.node.layout.origin = "explicit";
    location.node.layout.intent = "mixed-local-cluster";
    location.node.layout.keepGroup = true;
    return true;
  }
