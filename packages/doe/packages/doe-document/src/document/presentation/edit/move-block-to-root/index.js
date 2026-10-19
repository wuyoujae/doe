import { findLocation as __doeFn_findLocation } from "../../../../../../doe-core/src/operation/find-location/index.js";
import { ancestorGroups as __doeFn_ancestorGroups } from "../../layout/ancestor-groups/index.js";
import { isEdgeSplitGroup as __doeFn_isEdgeSplitGroup } from "../../layout/is-edge-split-group/index.js";
import { collapseDegenerateCompressionGroups as __doeFn_collapseDegenerateCompressionGroups } from "../../layout/collapse-degenerate-compression-groups/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:2943


export function moveBlockToRoot(state, sourceId, position = "end") {
    const sourceLocation = (0, __doeFn_findLocation)(state.slide.blocks, sourceId);
    if (!sourceLocation) return false;
    const sourceAncestors = (0, __doeFn_ancestorGroups)(state.slide.blocks, sourceId) || [];
    if (sourceAncestors.some((group) => (0, __doeFn_isEdgeSplitGroup)(group))) return false;
    if (
      sourceLocation.array === state.slide.blocks &&
      ((position === "start" && sourceLocation.index === 0) ||
        (position !== "start" &&
          sourceLocation.index === state.slide.blocks.length - 1))
    ) {
      return false;
    }
    const [sourceNode] = sourceLocation.array.splice(sourceLocation.index, 1);
    (0, __doeFn_collapseDegenerateCompressionGroups)(state.slide.blocks);
    if (position === "start") state.slide.blocks.unshift(sourceNode);
    else state.slide.blocks.push(sourceNode);
    state.selectedId = sourceId;
    return true;
  }
