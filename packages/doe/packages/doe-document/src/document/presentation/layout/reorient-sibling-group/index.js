import { findLocation as __doeFn_findLocation } from '../../../../../../doe-core/src/operation/find-location/index.js';
import { isCompositionGroup as __doeFn_isCompositionGroup } from '../is-composition-group/index.js';
import { isCollectionGroup as __doeFn_isCollectionGroup } from '../is-collection-group/index.js';
import { orderedPair as __doeFn_orderedPair } from '../ordered-pair/index.js';
import { isLocalCluster as __doeFn_isLocalCluster } from '../is-local-cluster/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:3016


export function reorientSiblingGroup(
    state,
    sourceId,
    targetId,
    placement = "auto",
    requestedDirection = "auto",
  ) {
    const source = (0, __doeFn_findLocation)(state.slide.blocks, sourceId);
    const target = (0, __doeFn_findLocation)(state.slide.blocks, targetId);
    if (
      !source ||
      !target ||
      source.array !== target.array ||
      !source.parentGroup ||
      source.parentGroup !== target.parentGroup ||
      source.parentGroup.children.length !== 2
    ) {
      return false;
    }
    const parent = source.parentGroup;
    if (!(0, __doeFn_isCompositionGroup)(parent) && !(0, __doeFn_isCollectionGroup)(parent)) return false;
    const direction =
      requestedDirection === "auto"
        ? parent.layout.direction === "stack"
          ? "stack"
          : "row"
        : requestedDirection === "stack"
          ? "stack"
          : "row";
    parent.children =
      placement === "auto"
        ? [...parent.children].reverse()
        : (0, __doeFn_orderedPair)(
            source.node,
            target.node,
            placement,
            source.index < target.index,
          );
    parent.layout.direction = direction;
    parent.layout.columns = direction === "stack" ? 1 : 2;
    parent.layout.origin = "explicit";
    parent.layout.intent = "direct-reorient";
    if ((0, __doeFn_isCollectionGroup)(parent) && !(0, __doeFn_isLocalCluster)(parent)) {
      parent.layout.variant = direction === "stack" ? "stack" : "auto-grid";
    } else {
      parent.layout.variant = "composition";
    }
    state.selectedId = parent.id;
    return true;
  }
