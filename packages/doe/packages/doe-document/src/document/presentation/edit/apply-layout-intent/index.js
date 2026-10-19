import { clusterTogether as __doeFn_clusterTogether } from "../../layout/cluster-together/index.js";
import { reorientSiblingGroup as __doeFn_reorientSiblingGroup } from "../../layout/reorient-sibling-group/index.js";
import { setAncestorGroupAxis as __doeFn_setAncestorGroupAxis } from "../../layout/set-ancestor-group-axis/index.js";
import { liftToAncestor as __doeFn_liftToAncestor } from "../../layout/lift-to-ancestor/index.js";
import { collectTogether as __doeFn_collectTogether } from "../../layout/collect-together/index.js";
import { composeTogether as __doeFn_composeTogether } from "../../layout/compose-together/index.js";
import { swapEdgeRegions as __doeFn_swapEdgeRegions } from "../../layout/swap-edge-regions/index.js";
import { setEdgeMediaPosition as __doeFn_setEdgeMediaPosition } from "../../layout/set-edge-media-position/index.js";
import { setEdgeMediaRatio as __doeFn_setEdgeMediaRatio } from "../../layout/set-edge-media-ratio/index.js";
import { setEdgeMediaShape as __doeFn_setEdgeMediaShape } from "../../layout/set-edge-media-shape/index.js";
import { setEdgeMediaContentAlign as __doeFn_setEdgeMediaContentAlign } from "../../layout/set-edge-media-content-align/index.js";
import { moveBlock as __doeFn_moveBlock } from "../move-block/index.js";
import { moveBlockToRoot as __doeFn_moveBlockToRoot } from "../move-block-to-root/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:3581


export function applyLayoutIntent(state, intent = {}) {
    const sourceId = intent.sourceId || intent.source;
    const targetId = intent.targetId || intent.target;
    const placement = intent.placement || "auto";
    const direction = intent.direction || "auto";
    switch (intent.op) {
      case "cluster":
        return (0, __doeFn_clusterTogether)(
          state,
          sourceId,
          targetId,
          placement,
          direction,
        );
      case "reorient":
        return (0, __doeFn_reorientSiblingGroup)(
          state,
          sourceId,
          targetId,
          placement,
          direction,
        );
      case "axis":
        return (0, __doeFn_setAncestorGroupAxis)(state, sourceId, targetId, direction);
      case "lift":
        return (0, __doeFn_liftToAncestor)(state, sourceId, targetId, placement);
      case "collect":
        return (0, __doeFn_collectTogether)(
          state,
          sourceId,
          targetId,
          placement,
          direction,
        );
      case "compose":
        return (0, __doeFn_composeTogether)(
          state,
          sourceId,
          targetId,
          placement,
          direction,
        );
      case "swap":
        return (0, __doeFn_swapEdgeRegions)(state, sourceId, targetId);
      case "edge-media-position":
        return (0, __doeFn_setEdgeMediaPosition)(
          state,
          intent.groupId || targetId || sourceId,
          intent.position || intent.mediaPosition,
          intent.mediaRatio,
        );
      case "edge-media-ratio":
        return (0, __doeFn_setEdgeMediaRatio)(
          state,
          intent.groupId || targetId || sourceId,
          intent.mediaRatio,
        );
      case "edge-media-shape":
        return (0, __doeFn_setEdgeMediaShape)(
          state,
          intent.groupId || targetId || sourceId,
          intent.shape || intent.mediaShape,
        );
      case "edge-media-content-align":
        return (0, __doeFn_setEdgeMediaContentAlign)(
          state,
          intent.groupId || targetId || sourceId,
          intent.contentAlign,
        );
      case "before":
      case "after":
        return (0, __doeFn_moveBlock)(state, sourceId, targetId, intent.op);
      case "detach-root":
        return (0, __doeFn_moveBlockToRoot)(state, sourceId, intent.position || "end");
      default:
        return false;
    }
  }
