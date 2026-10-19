import { findLocation as __doeFn_findLocation } from '../../../../../../doe-core/src/operation/find-location/index.js';
import { isCompositionGroup as __doeFn_isCompositionGroup } from '../is-composition-group/index.js';
import { isCollectionGroup as __doeFn_isCollectionGroup } from '../is-collection-group/index.js';
import { isLocalCluster as __doeFn_isLocalCluster } from '../is-local-cluster/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:3067


export function setAncestorGroupAxis(
    state,
    sourceId,
    targetGroupId,
    requestedDirection = "auto",
  ) {
    const source = (0, __doeFn_findLocation)(state.slide.blocks, sourceId);
    const target = (0, __doeFn_findLocation)(state.slide.blocks, targetGroupId);
    if (
      !source ||
      !target ||
      target.node.type !== "layout-group" ||
      source.parentGroup !== target.node ||
      (!(0, __doeFn_isCompositionGroup)(target.node) && !(0, __doeFn_isCollectionGroup)(target.node))
    ) {
      return false;
    }
    const direction =
      requestedDirection === "auto"
        ? target.node.layout.direction === "stack"
          ? "stack"
          : "row"
        : requestedDirection === "stack"
          ? "stack"
          : "row";
    target.node.layout.direction = direction;
    target.node.layout.columns =
      direction === "stack" ? 1 : (0, __doeFn_isCollectionGroup)(target.node) ? "auto" : target.node.children.length;
    target.node.layout.origin = "explicit";
    target.node.layout.intent = "direct-axis";
    if ((0, __doeFn_isCollectionGroup)(target.node) && !(0, __doeFn_isLocalCluster)(target.node)) {
      target.node.layout.variant = direction === "stack" ? "stack" : "auto-grid";
    } else {
      target.node.layout.variant = "composition";
    }
    state.selectedId = target.node.id;
    return true;
  }
