import { findLocation as __doeFn_findLocation } from '../../../../../../doe-core/src/operation/find-location/index.js';
import { containsId as __doeFn_containsId } from '../../../../../../doe-core/src/operation/contains-id/index.js';
import { isCollectionGroup as __doeFn_isCollectionGroup } from '../is-collection-group/index.js';
import { collectionKey as __doeFn_collectionKey } from '../collection-key/index.js';
import { collapseDegenerateCompressionGroups as __doeFn_collapseDegenerateCompressionGroups } from '../collapse-degenerate-compression-groups/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:3343


export function liftToAncestor(
    state,
    sourceId,
    targetGroupId,
    placement = "after",
  ) {
    const source = (0, __doeFn_findLocation)(state.slide.blocks, sourceId);
    const target = (0, __doeFn_findLocation)(state.slide.blocks, targetGroupId);
    if (
      !source ||
      !target ||
      target.node.type !== "layout-group" ||
      source.parentGroup === target.node ||
      !(0, __doeFn_containsId)(target.node, sourceId)
    ) {
      return false;
    }
    if ((0, __doeFn_isCollectionGroup)(target.node)) {
      const expectedKey = (0, __doeFn_collectionKey)(target.node);
      if (!expectedKey || (0, __doeFn_collectionKey)(source.node) !== expectedKey) return false;
    }
    const branchIndex = target.node.children.findIndex((child) =>
      (0, __doeFn_containsId)(child, sourceId),
    );
    const [sourceNode] = source.array.splice(source.index, 1);
    (0, __doeFn_collapseDegenerateCompressionGroups)(state.slide.blocks);
    const refreshedTarget = (0, __doeFn_findLocation)(state.slide.blocks, targetGroupId);
    if (!refreshedTarget) return false;
    const insertionIndex = Math.max(
      0,
      Math.min(
        refreshedTarget.node.children.length,
        branchIndex + (placement === "before" ? 0 : 1),
      ),
    );
    refreshedTarget.node.children.splice(insertionIndex, 0, sourceNode);
    state.selectedId = sourceId;
    return true;
  }
