import { nodeLayoutProfile as __doeFn_nodeLayoutProfile } from '../node-layout-profile/index.js';
import { compositionRequirements as __doeFn_compositionRequirements } from '../composition-requirements/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:2117
import { scope as __doeScope } from "../../runtime/context/index.js";

export function compositionPairPolicy(
    sourceNode,
    targetNode,
    availableWidth = 0,
    requestedDirection = "auto",
  ) {
    if (!sourceNode || !targetNode) {
      return { allowed: false, reason: "无效组合目标" };
    }
    const sameLeafType =
      sourceNode.type !== "layout-group" &&
      targetNode.type !== "layout-group" &&
      sourceNode.type === targetNode.type;
    const sourceProfile = (0, __doeFn_nodeLayoutProfile)(sourceNode);
    const targetProfile = (0, __doeFn_nodeLayoutProfile)(targetNode);
    if (!sourceProfile?.enabled || !targetProfile?.enabled) {
      return { allowed: false, reason: "其中一个组件不支持组合" };
    }

    const requested = __doeScope.COMPOSITION_DIRECTIONS.includes(requestedDirection)
      ? requestedDirection
      : "auto";
    const preferredDirection = requested === "auto" ? "row" : requested;
    const fallbackDirection = preferredDirection === "row" ? "stack" : "row";
    const directions = [preferredDirection, fallbackDirection];
    const gap = __doeScope.SPACING_TOKENS["18pt"];
    const rowRequired = (0, __doeFn_compositionRequirements)(
      [sourceProfile, targetProfile],
      gap,
      "comfortable",
    ).requiredWidth;
    const stackRequired = Math.max(
      sourceProfile.minWidth,
      targetProfile.minWidth,
    );
    const resolvedDirection = directions.find((direction) => {
      if (!availableWidth) return true;
      const required = direction === "row" ? rowRequired : stackRequired;
      return availableWidth + 1 >= required;
    });
    if (!resolvedDirection) {
      return {
        allowed: false,
        reason: `可用宽度不足：至少需要 ${Math.ceil(stackRequired)}px`,
        minimumWidth: stackRequired,
      };
    }
    return {
      allowed: true,
      sourceProfile,
      targetProfile,
      availableWidth,
      requestedDirection: requested,
      direction: resolvedDirection,
      fallbackApplied: resolvedDirection !== preferredDirection,
      ratio: "auto",
      sameType: sameLeafType,
      minimumWidth: resolvedDirection === "row" ? rowRequired : stackRequired,
    };
  }
