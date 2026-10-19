import { edgeSplitPair as __doeFn_edgeSplitPair } from "../../layout/edge-split-pair/index.js";
import { swapEdgeRegions as __doeFn_swapEdgeRegions } from "../../layout/swap-edge-regions/index.js";
import { findLocation as __doeFn_findLocation } from "../../../../../../doe-core/src/operation/find-location/index.js";
import { containsId as __doeFn_containsId } from "../../../../../../doe-core/src/operation/contains-id/index.js";
import { canMoveBeside as __doeFn_canMoveBeside } from "../../layout/can-move-beside/index.js";
import { collapseDegenerateCompressionGroups as __doeFn_collapseDegenerateCompressionGroups } from "../../layout/collapse-degenerate-compression-groups/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:2918


export function moveBlock(state, sourceId, targetId, position) {
    if (!sourceId || !targetId || sourceId === targetId) return false;
    if ((0, __doeFn_edgeSplitPair)(state, sourceId, targetId)) {
      return (0, __doeFn_swapEdgeRegions)(state, sourceId, targetId);
    }
    const sourceLocation = (0, __doeFn_findLocation)(state.slide.blocks, sourceId);
    const targetLocation = (0, __doeFn_findLocation)(state.slide.blocks, targetId);
    if (!sourceLocation || !targetLocation) return false;
    if ((0, __doeFn_containsId)(sourceLocation.node, targetId)) return false;
    if (!(0, __doeFn_canMoveBeside)(state, sourceId, targetId)) return false;

    const [sourceNode] = sourceLocation.array.splice(sourceLocation.index, 1);
    const updatedTarget = (0, __doeFn_findLocation)(state.slide.blocks, targetId);
    if (!updatedTarget) {
      sourceLocation.array.splice(sourceLocation.index, 0, sourceNode);
      return false;
    }
    const insertionIndex =
      updatedTarget.index + (position === "after" ? 1 : 0);
    updatedTarget.array.splice(insertionIndex, 0, sourceNode);
    (0, __doeFn_collapseDegenerateCompressionGroups)(state.slide.blocks);
    state.selectedId = sourceId;
    return true;
  }
