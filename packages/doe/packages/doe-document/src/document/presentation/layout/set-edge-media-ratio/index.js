import { findLocation as __doeFn_findLocation } from '../../../../../../doe-core/src/operation/find-location/index.js';
import { isEdgeSplitGroup as __doeFn_isEdgeSplitGroup } from '../is-edge-split-group/index.js';
import { edgeMediaPosition as __doeFn_edgeMediaPosition } from '../edge-media-position/index.js';
import { normalizeEdgeMediaRatio as __doeFn_normalizeEdgeMediaRatio } from '../../schema/normalize-edge-media-ratio/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:2451


export function setEdgeMediaRatio(state, groupId, mediaRatio) {
    const location = (0, __doeFn_findLocation)(state.slide.blocks, groupId);
    if (!location || !(0, __doeFn_isEdgeSplitGroup)(location.node)) return false;
    const node = location.node;
    const position = (0, __doeFn_edgeMediaPosition)(node);
    const nextRatio = (0, __doeFn_normalizeEdgeMediaRatio)(mediaRatio, position);
    const currentRatio = (0, __doeFn_normalizeEdgeMediaRatio)(
      node.layout.mediaRatio,
      position,
    );
    if (Math.abs(nextRatio - currentRatio) < 0.0005) return false;
    node.layout.mediaRatio = Math.round(nextRatio * 1000) / 1000;
    state.selectedId = node.id;
    return true;
  }
