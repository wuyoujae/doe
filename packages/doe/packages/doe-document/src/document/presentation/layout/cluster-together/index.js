import { clusterEligibility as __doeFn_clusterEligibility } from '../cluster-eligibility/index.js';
import { findLocation as __doeFn_findLocation } from '../../../../../../doe-core/src/operation/find-location/index.js';
import { isLocalCluster as __doeFn_isLocalCluster } from '../is-local-cluster/index.js';
import { containsId as __doeFn_containsId } from '../../../../../../doe-core/src/operation/contains-id/index.js';
import { configureLocalCluster as __doeFn_configureLocalCluster } from '../configure-local-cluster/index.js';
import { exitCollectionForMixedCluster as __doeFn_exitCollectionForMixedCluster } from '../exit-collection-for-mixed-cluster/index.js';
import { collapseDegenerateCompressionGroups as __doeFn_collapseDegenerateCompressionGroups } from '../collapse-degenerate-compression-groups/index.js';
import { localClusterGroupId as __doeFn_localClusterGroupId } from '../local-cluster-group-id/index.js';
import { orderedPair as __doeFn_orderedPair } from '../ordered-pair/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:3247


export function clusterTogether(
    state,
    sourceId,
    targetId,
    placement = "auto",
    requestedDirection = "auto",
  ) {
    const eligibility = (0, __doeFn_clusterEligibility)(
      state,
      sourceId,
      targetId,
      requestedDirection,
    );
    if (!eligibility.allowed) return false;
    const sourceLocation = (0, __doeFn_findLocation)(state.slide.blocks, sourceId);
    const targetBefore = (0, __doeFn_findLocation)(state.slide.blocks, targetId);
    if (!sourceLocation || !targetBefore) return false;
    const sourceBeforeTarget =
      sourceLocation.array === targetBefore.array &&
      sourceLocation.index < targetBefore.index;

    const existingCluster = (0, __doeFn_isLocalCluster)(targetBefore.node)
      ? targetBefore.node
      : (0, __doeFn_isLocalCluster)(targetBefore.parentGroup)
        ? targetBefore.parentGroup
        : null;
    if (existingCluster && (0, __doeFn_containsId)(existingCluster, sourceId)) {
      const targetLocation = (0, __doeFn_findLocation)(state.slide.blocks, targetId);
      if (!targetLocation || targetLocation.array !== existingCluster.children) return false;
      const sourceInCluster = (0, __doeFn_findLocation)(existingCluster.children, sourceId, existingCluster);
      if (!sourceInCluster) return false;
      const [sourceNode] = sourceInCluster.array.splice(sourceInCluster.index, 1);
      const refreshedTarget = (0, __doeFn_findLocation)(existingCluster.children, targetId, existingCluster);
      if (!refreshedTarget) return false;
      const insertAt =
        refreshedTarget.index + (["right", "bottom"].includes(placement) ? 1 : 0);
      refreshedTarget.array.splice(insertAt, 0, sourceNode);
      (0, __doeFn_configureLocalCluster)(existingCluster, eligibility, eligibility.direction);
      if (eligibility.exitsCollection) {
        (0, __doeFn_exitCollectionForMixedCluster)(state, eligibility.targetCollectionId);
      }
      state.selectedId = existingCluster.id;
      return true;
    }

    const [sourceNode] = sourceLocation.array.splice(sourceLocation.index, 1);
    (0, __doeFn_collapseDegenerateCompressionGroups)(state.slide.blocks);
    const targetLocation = (0, __doeFn_findLocation)(state.slide.blocks, targetId);
    if (!targetLocation) return false;

    const targetCluster = (0, __doeFn_isLocalCluster)(targetLocation.node)
      ? targetLocation.node
      : (0, __doeFn_isLocalCluster)(targetLocation.parentGroup)
        ? targetLocation.parentGroup
        : null;
    if (targetCluster) {
      const targetChild = targetCluster.children.findIndex((child) =>
        (0, __doeFn_containsId)(child, targetId),
      );
      const insertionIndex = Math.max(
        0,
        targetChild + (["right", "bottom"].includes(placement) ? 1 : 0),
      );
      targetCluster.children.splice(insertionIndex, 0, sourceNode);
      (0, __doeFn_configureLocalCluster)(targetCluster, eligibility, eligibility.direction);
      if (eligibility.exitsCollection) {
        (0, __doeFn_exitCollectionForMixedCluster)(state, eligibility.targetCollectionId);
      }
      state.selectedId = targetCluster.id;
      return true;
    }

    const cluster = (0, __doeFn_configureLocalCluster)(
      {
        id: (0, __doeFn_localClusterGroupId)(state, sourceId, targetId),
        type: "layout-group",
        kind: "cluster",
        layout: {},
        children: (0, __doeFn_orderedPair)(
          sourceNode,
          targetLocation.node,
          placement,
          sourceBeforeTarget,
        ),
      },
      eligibility,
      eligibility.direction,
    );
    targetLocation.array.splice(targetLocation.index, 1, cluster);
    if (eligibility.exitsCollection) {
      (0, __doeFn_exitCollectionForMixedCluster)(state, eligibility.targetCollectionId);
    }
    state.selectedId = cluster.id;
    return true;
  }
