import { findLocation as __doeFn_findLocation } from '../../../../../../doe-core/src/operation/find-location/index.js';
import { containsId as __doeFn_containsId } from '../../../../../../doe-core/src/operation/contains-id/index.js';
import { collectionKey as __doeFn_collectionKey } from '../collection-key/index.js';
import { isCollectionGroup as __doeFn_isCollectionGroup } from '../is-collection-group/index.js';
import { collectionItemCount as __doeFn_collectionItemCount } from '../collection-item-count/index.js';
import { collectionContract as __doeFn_collectionContract } from '../collection-contract/index.js';
import { compositionPlanningWidth as __doeFn_compositionPlanningWidth } from '../composition-planning-width/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:2286
import { scope as __doeScope } from "../../runtime/context/index.js";

export function collectionEligibility(
    state,
    sourceId,
    targetId,
    requestedDirection = "auto",
  ) {
    const source = (0, __doeFn_findLocation)(state.slide.blocks, sourceId);
    const target = (0, __doeFn_findLocation)(state.slide.blocks, targetId);
    if (!source || !target || sourceId === targetId) {
      return { allowed: false, reason: "无效集合目标" };
    }
    if ((0, __doeFn_containsId)(source.node, targetId) || (0, __doeFn_containsId)(target.node, sourceId)) {
      return { allowed: false, reason: "集合不能包含自身或自己的祖先" };
    }

    const sourceKey = (0, __doeFn_collectionKey)(source.node);
    const targetKey = (0, __doeFn_collectionKey)(target.node);
    const parentKey = (0, __doeFn_collectionKey)(target.parentGroup);
    const resolvedKey = targetKey || parentKey;
    if (!sourceKey || !resolvedKey || sourceKey !== resolvedKey) {
      return { allowed: false, reason: "组件不属于同一可布局集合" };
    }

    const targetCollection = (0, __doeFn_isCollectionGroup)(target.node)
      ? target.node
      : (0, __doeFn_isCollectionGroup)(target.parentGroup)
        ? target.parentGroup
        : null;
    const sourceCount = (0, __doeFn_collectionItemCount)(source.node);
    const targetCount = targetCollection
      ? (0, __doeFn_collectionItemCount)(targetCollection)
      : (0, __doeFn_collectionItemCount)(target.node);
    const contract =
      (0, __doeFn_collectionContract)(targetCollection || target.node) ||
      (0, __doeFn_collectionContract)(source.node) ||
      {};
    const maximum = Math.max(
      2,
      Math.min(
        __doeScope.MAX_COLLECTION_ITEMS,
        Number(targetCollection?.layout?.maxItems) ||
          Number(contract.maxItems) ||
          __doeScope.MAX_COLLECTION_ITEMS,
      ),
    );
    const sourceAlreadyInTarget =
      targetCollection && (0, __doeFn_containsId)(targetCollection, sourceId);
    const projectedCount = sourceAlreadyInTarget
      ? targetCount
      : sourceCount + targetCount;
    if (projectedCount > maximum) {
      return {
        allowed: false,
        reason: `单个集合最多容纳 ${maximum} 个项目；超出部分应自动分包或续页`,
      };
    }

    const requested = __doeScope.COMPOSITION_DIRECTIONS.includes(requestedDirection)
      ? requestedDirection
      : "auto";
    const direction = requested === "stack" ? "stack" : "row";
    return {
      allowed: true,
      mode: "collection",
      collectionKey: resolvedKey,
      direction,
      requestedDirection: requested,
      maxColumns: Math.max(
        1,
        Math.min(6, Number(contract.maxColumns) || 4),
      ),
      maxItems: maximum,
      availableWidth: (0, __doeFn_compositionPlanningWidth)(state, targetId),
    };
  }
