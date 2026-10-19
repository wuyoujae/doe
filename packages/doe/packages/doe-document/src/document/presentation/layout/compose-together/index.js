import { collectionEligibility as __doeFn_collectionEligibility } from '../collection-eligibility/index.js';
import { findLocation as __doeFn_findLocation } from '../../../../../../doe-core/src/operation/find-location/index.js';
import { isLocalCluster as __doeFn_isLocalCluster } from '../is-local-cluster/index.js';
import { collectTogether as __doeFn_collectTogether } from '../collect-together/index.js';
import { compositionEligibility as __doeFn_compositionEligibility } from '../composition-eligibility/index.js';
import { collapseDegenerateCompressionGroups as __doeFn_collapseDegenerateCompressionGroups } from '../collapse-degenerate-compression-groups/index.js';
import { profileOrderRank as __doeFn_profileOrderRank } from '../profile-order-rank/index.js';
import { nodeLayoutProfile as __doeFn_nodeLayoutProfile } from '../node-layout-profile/index.js';
import { isCompositionGroup as __doeFn_isCompositionGroup } from '../is-composition-group/index.js';
import { compositionGroupId as __doeFn_compositionGroupId } from '../composition-group-id/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:3468
import { scope as __doeScope } from "../../runtime/context/index.js";

export function composeTogether(
    state,
    sourceId,
    targetId,
    placement = "auto",
    requestedDirection = "auto",
  ) {
    const collection = (0, __doeFn_collectionEligibility)(
      state,
      sourceId,
      targetId,
      requestedDirection,
    );
    const sourceBefore = (0, __doeFn_findLocation)(state.slide.blocks, sourceId);
    const targetBefore = (0, __doeFn_findLocation)(state.slide.blocks, targetId);
    if (
      collection.allowed &&
      !(0, __doeFn_isLocalCluster)(sourceBefore?.node) &&
      !(0, __doeFn_isLocalCluster)(targetBefore?.node) &&
      !(0, __doeFn_isLocalCluster)(targetBefore?.parentGroup)
    ) {
      return (0, __doeFn_collectTogether)(
        state,
        sourceId,
        targetId,
        placement,
        requestedDirection,
      );
    }
    const eligibility = (0, __doeFn_compositionEligibility)(
      state,
      sourceId,
      targetId,
      requestedDirection,
    );
    if (!eligibility.allowed) return false;
    const sourceLocation = (0, __doeFn_findLocation)(state.slide.blocks, sourceId);
    if (!sourceLocation) return false;
    const [sourceNode] = sourceLocation.array.splice(sourceLocation.index, 1);
    (0, __doeFn_collapseDegenerateCompressionGroups)(state.slide.blocks);
    const targetLocation = (0, __doeFn_findLocation)(state.slide.blocks, targetId);
    if (!targetLocation) return false;
    const targetNode = targetLocation.node;
    const sourceFirst =
      placement === "left" ||
      placement === "top" ||
      (placement === "auto" &&
        (0, __doeFn_profileOrderRank)((0, __doeFn_nodeLayoutProfile)(sourceNode)) <
          (0, __doeFn_profileOrderRank)((0, __doeFn_nodeLayoutProfile)(targetNode)));
    const direction = eligibility.direction;

    if (
      (0, __doeFn_isCompositionGroup)(targetNode) &&
      targetNode.children.length < __doeScope.MAX_COMPOSITION_ITEMS
    ) {
      if (targetNode.layout.direction === "auto") {
        targetNode.layout.direction = direction;
      }
      const insertionIndex = sourceFirst ? 0 : targetNode.children.length;
      targetNode.children.splice(insertionIndex, 0, sourceNode);
      targetNode.layout.columns =
        targetNode.layout.direction === "row" ? targetNode.children.length : 1;
      state.selectedId = targetNode.id;
      return true;
    }

    const parentGroup = targetLocation.parentGroup;
    if (
      (0, __doeFn_isCompositionGroup)(parentGroup) &&
      parentGroup.children.length < __doeScope.MAX_COMPOSITION_ITEMS &&
      eligibility.strategy !== "nest-target" &&
      ["auto", direction].includes(parentGroup.layout.direction)
    ) {
      if (parentGroup.layout.direction === "auto") {
        parentGroup.layout.direction = direction;
      }
      const insertionIndex =
        targetLocation.index + (sourceFirst ? 0 : 1);
      targetLocation.array.splice(insertionIndex, 0, sourceNode);
      parentGroup.layout.columns =
        parentGroup.layout.direction === "row" ? parentGroup.children.length : 1;
      state.selectedId = parentGroup.id;
      return true;
    }

    const compositionGroup = {
      id: (0, __doeFn_compositionGroupId)(state, sourceId, targetId),
      type: "layout-group",
      kind: "container",
      layout: {
        variant: "composition",
        direction,
        ratio: eligibility.ratio || "auto",
        preset: "adaptive-container",
        columns: direction === "row" ? 2 : 1,
        maxColumns: __doeScope.MAX_COMPOSITION_ITEMS,
        gap: "18pt",
        align: direction === "row" ? "center" : "stretch",
        textFit: { mode: "readable", minBodyPt: __doeScope.MIN_READABLE_FONT_PT },
      },
      children: sourceFirst
        ? [sourceNode, targetNode]
        : [targetNode, sourceNode],
    };
    targetLocation.array.splice(targetLocation.index, 1, compositionGroup);
    state.selectedId = compositionGroup.id;
    return true;
  }
