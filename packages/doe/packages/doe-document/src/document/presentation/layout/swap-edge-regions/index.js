import { edgeSplitPair as __doeFn_edgeSplitPair } from '../edge-split-pair/index.js';
import { edgeMediaPosition as __doeFn_edgeMediaPosition } from '../edge-media-position/index.js';
import { setEdgeMediaPosition as __doeFn_setEdgeMediaPosition } from '../set-edge-media-position/index.js';
import { oppositeEdgeMediaPosition as __doeFn_oppositeEdgeMediaPosition } from '../opposite-edge-media-position/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:2596


export function swapEdgeRegions(state, sourceId, targetId) {
    const pair = (0, __doeFn_edgeSplitPair)(state, sourceId, targetId);
    if (!pair) return false;
    const current = (0, __doeFn_edgeMediaPosition)(pair.group);
    return (0, __doeFn_setEdgeMediaPosition)(
      state,
      pair.group.id,
      (0, __doeFn_oppositeEdgeMediaPosition)(current),
    );
  }
