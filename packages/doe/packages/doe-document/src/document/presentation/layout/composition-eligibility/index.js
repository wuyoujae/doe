import { findLocation as __doeFn_findLocation } from '../../../../../../doe-core/src/operation/find-location/index.js';
import { containsId as __doeFn_containsId } from '../../../../../../doe-core/src/operation/contains-id/index.js';
import { ancestorGroups as __doeFn_ancestorGroups } from '../ancestor-groups/index.js';
import { isEdgeSplitGroup as __doeFn_isEdgeSplitGroup } from '../is-edge-split-group/index.js';
import { contextAwareCompositionDirection as __doeFn_contextAwareCompositionDirection } from '../context-aware-composition-direction/index.js';
import { compositionPlanningWidth as __doeFn_compositionPlanningWidth } from '../composition-planning-width/index.js';
import { compositionPairPolicy as __doeFn_compositionPairPolicy } from '../composition-pair-policy/index.js';
import { compositionSubtreeDepth as __doeFn_compositionSubtreeDepth } from '../composition-subtree-depth/index.js';
import { isCompositionGroup as __doeFn_isCompositionGroup } from '../is-composition-group/index.js';
import { compositionAncestorDepth as __doeFn_compositionAncestorDepth } from '../composition-ancestor-depth/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:2192
import { scope as __doeScope } from "../../runtime/context/index.js";

export function compositionEligibility(
    state,
    sourceId,
    targetId,
    requestedDirection = "auto",
  ) {
    const source = (0, __doeFn_findLocation)(state.slide.blocks, sourceId);
    const target = (0, __doeFn_findLocation)(state.slide.blocks, targetId);
    if (!source || !target || sourceId === targetId) {
      return { allowed: false, reason: "无效组合目标" };
    }
    if ((0, __doeFn_containsId)(source.node, targetId)) {
      return { allowed: false, reason: "不能把容器拖入自己的子级" };
    }
    if ((0, __doeFn_containsId)(target.node, sourceId)) {
      return { allowed: false, reason: "目标容器已经包含该组件" };
    }
    const touchesLockedRegion = [sourceId, targetId].some((id) =>
      ((0, __doeFn_ancestorGroups)(state.slide.blocks, id) || []).some((group) =>
        (0, __doeFn_isEdgeSplitGroup)(group),
      ),
    );
    if (touchesLockedRegion) {
      return {
        allowed: false,
        reason: "贴边区域只能整体换边，不能进入普通内容组合",
      };
    }
    const contextual = (0, __doeFn_contextAwareCompositionDirection)(
      source.node,
      target.node,
      target.parentGroup,
      requestedDirection,
    );
    const availableWidth = (0, __doeFn_compositionPlanningWidth)(state, targetId);
    const policy = (0, __doeFn_compositionPairPolicy)(
      source.node,
      target.node,
      availableWidth,
      contextual.direction,
    );
    if (!policy.allowed) return policy;
    const sourceDepth = (0, __doeFn_compositionSubtreeDepth)(source.node);
    const targetDepth = (0, __doeFn_compositionSubtreeDepth)(target.node);
    const targetParent = target.parentGroup;
    const targetIsOpenContainer =
      (0, __doeFn_isCompositionGroup)(target.node) &&
      target.node.children.length < __doeScope.MAX_COMPOSITION_ITEMS;
    const parentAcceptsDirectly =
      (0, __doeFn_isCompositionGroup)(targetParent) &&
      targetParent.children.length < __doeScope.MAX_COMPOSITION_ITEMS &&
      contextual.strategy !== "nest-target" &&
      ["auto", policy.direction].includes(targetParent.layout.direction);
    let projectedDepth;
    if (targetIsOpenContainer) {
      projectedDepth =
        (0, __doeFn_compositionAncestorDepth)(state, targetId) + 1 + sourceDepth;
    } else if (parentAcceptsDirectly) {
      projectedDepth = (0, __doeFn_compositionAncestorDepth)(state, targetId) + sourceDepth;
    } else {
      projectedDepth =
        (0, __doeFn_compositionAncestorDepth)(state, targetId) +
        1 +
        Math.max(sourceDepth, targetDepth);
    }
    if (projectedDepth > __doeScope.MAX_COMPOSITION_DEPTH) {
      return {
        allowed: false,
        reason: `最多允许 ${__doeScope.MAX_COMPOSITION_DEPTH} 层组合`,
        projectedDepth,
      };
    }
    return {
      ...policy,
      projectedDepth,
      strategy: contextual.strategy,
      planningWidth: availableWidth,
    };
  }
