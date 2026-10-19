import { findLocation as __doeFn_findLocation } from '../../../../../../doe-core/src/operation/find-location/index.js';
import { containsId as __doeFn_containsId } from '../../../../../../doe-core/src/operation/contains-id/index.js';
import { ancestorGroups as __doeFn_ancestorGroups } from '../ancestor-groups/index.js';
import { isEdgeSplitGroup as __doeFn_isEdgeSplitGroup } from '../is-edge-split-group/index.js';
import { localClusterPlanningWidth as __doeFn_localClusterPlanningWidth } from '../local-cluster-planning-width/index.js';
import { compositionPairPolicy as __doeFn_compositionPairPolicy } from '../composition-pair-policy/index.js';
import { isLocalCluster as __doeFn_isLocalCluster } from '../is-local-cluster/index.js';
import { compositionAncestorDepth as __doeFn_compositionAncestorDepth } from '../composition-ancestor-depth/index.js';
import { compositionSubtreeDepth as __doeFn_compositionSubtreeDepth } from '../composition-subtree-depth/index.js';
import { collectionKey as __doeFn_collectionKey } from '../collection-key/index.js';
import { isCollectionGroup as __doeFn_isCollectionGroup } from '../is-collection-group/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:3106
import { scope as __doeScope } from "../../runtime/context/index.js";

export function clusterEligibility(
    state,
    sourceId,
    targetId,
    requestedDirection = "auto",
  ) {
    const source = (0, __doeFn_findLocation)(state.slide.blocks, sourceId);
    const target = (0, __doeFn_findLocation)(state.slide.blocks, targetId);
    if (!source || !target || sourceId === targetId) {
      return { allowed: false, reason: "无效的局部组合目标" };
    }
    if ((0, __doeFn_containsId)(source.node, targetId)) {
      return { allowed: false, reason: "不能把容器拖入自己的后代" };
    }
    if ((0, __doeFn_containsId)(target.node, sourceId)) {
      return { allowed: false, reason: "请拖到父容器边缘以移出当前子组合" };
    }
    const touchesLockedRegion = [sourceId, targetId].some((id) =>
      ((0, __doeFn_ancestorGroups)(state.slide.blocks, id) || []).some((group) =>
        (0, __doeFn_isEdgeSplitGroup)(group),
      ),
    );
    if (touchesLockedRegion) {
      return {
        allowed: false,
        reason: "贴边图片区是锁定 region，只能切换左、右、上、下位置",
      };
    }
    const requested = __doeScope.COMPOSITION_DIRECTIONS.includes(requestedDirection)
      ? requestedDirection
      : "auto";
    // Plan against the nearest reflowable parent, not the target's current
    // narrow cell. The parent may reduce columns or rebalance tracks after the
    // drop, so current cell width must not make valid operations order-dependent.
    const availableWidth = (0, __doeFn_localClusterPlanningWidth)(state, targetId);
    const policy = (0, __doeFn_compositionPairPolicy)(
      source.node,
      target.node,
      availableWidth,
      requested,
    );
    if (!policy.allowed) return policy;
    const targetCluster = (0, __doeFn_isLocalCluster)(target.node)
      ? target.node
      : (0, __doeFn_isLocalCluster)(target.parentGroup)
        ? target.parentGroup
        : null;
    const addedCount = targetCluster?.children.some((child) => (0, __doeFn_containsId)(child, sourceId))
      ? 0
      : 1;
    if (targetCluster && targetCluster.children.length + addedCount > __doeScope.MAX_COMPOSITION_ITEMS) {
      return {
        allowed: false,
        reason: `局部组合最多包含 ${__doeScope.MAX_COMPOSITION_ITEMS} 个直接成员；系统应改为相邻分组`,
      };
    }
    const projectedDepth = targetCluster
      ? (0, __doeFn_compositionAncestorDepth)(state, targetCluster.id) + 1 + (0, __doeFn_compositionSubtreeDepth)(source.node)
      : (0, __doeFn_compositionAncestorDepth)(state, targetId) +
        1 +
        Math.max(
          (0, __doeFn_compositionSubtreeDepth)(source.node),
          (0, __doeFn_compositionSubtreeDepth)(target.node),
        );
    if (projectedDepth > __doeScope.MAX_COMPOSITION_DEPTH) {
      return {
        allowed: false,
        reason: `局部排版最多 ${__doeScope.MAX_COMPOSITION_DEPTH} 层；请先拖到父容器边缘移出一层`,
      };
    }
    const sourceKey = (0, __doeFn_collectionKey)(source.node);
    const targetKey = (0, __doeFn_collectionKey)(target.node);
    const targetCollection = [...((0, __doeFn_ancestorGroups)(state.slide.blocks, targetId) || [])]
      .reverse()
      .find((group) => (0, __doeFn_isCollectionGroup)(group) && !(0, __doeFn_isLocalCluster)(group));
    const exitsCollection = Boolean(
      targetCollection &&
        targetCollection.layout.collectionKey &&
        sourceKey !== targetCollection.layout.collectionKey,
    );
    if (exitsCollection && targetCollection.layout.lock === "structure") {
      return {
        allowed: false,
        reason: "目标同类集合已锁定；请先解锁，或把文字与整个集合组成外层组合",
      };
    }
    return {
      ...policy,
      allowed: true,
      projectedDepth,
      collectionKey: sourceKey && sourceKey === targetKey ? sourceKey : null,
      exitsCollection,
      targetCollectionId: exitsCollection ? targetCollection.id : null,
    };
  }
