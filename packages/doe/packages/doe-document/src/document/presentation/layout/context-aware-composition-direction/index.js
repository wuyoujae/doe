import { nodeLayoutProfile as __doeFn_nodeLayoutProfile } from '../node-layout-profile/index.js';
import { isCompositionGroup as __doeFn_isCompositionGroup } from '../is-composition-group/index.js';
import { isWideProfile as __doeFn_isWideProfile } from '../is-wide-profile/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:2092


export function contextAwareCompositionDirection(
    sourceNode,
    targetNode,
    targetParent,
    requestedDirection,
  ) {
    if (requestedDirection !== "auto") {
      return { direction: requestedDirection, strategy: "requested" };
    }
    const sourceProfile = (0, __doeFn_nodeLayoutProfile)(sourceNode);
    const targetProfile = (0, __doeFn_nodeLayoutProfile)(targetNode);
    if (
      (0, __doeFn_isCompositionGroup)(targetParent) &&
      targetParent.layout.direction === "row" &&
      !(0, __doeFn_isWideProfile)(sourceProfile) &&
      !(0, __doeFn_isWideProfile)(targetProfile) &&
      targetParent.children.some(
        (child) => child !== targetNode && (0, __doeFn_isWideProfile)((0, __doeFn_nodeLayoutProfile)(child)),
      )
    ) {
      return { direction: "stack", strategy: "nest-target" };
    }
    return { direction: "auto", strategy: "auto" };
  }
