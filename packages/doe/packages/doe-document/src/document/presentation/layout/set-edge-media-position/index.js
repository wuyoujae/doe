import { findLocation as __doeFn_findLocation } from '../../../../../../doe-core/src/operation/find-location/index.js';
import { isEdgeSplitGroup as __doeFn_isEdgeSplitGroup } from '../is-edge-split-group/index.js';
import { edgeMediaPosition as __doeFn_edgeMediaPosition } from '../edge-media-position/index.js';
import { edgeMediaAxis as __doeFn_edgeMediaAxis } from '../edge-media-axis/index.js';
import { normalizeEdgeMediaRatio as __doeFn_normalizeEdgeMediaRatio } from '../../schema/normalize-edge-media-ratio/index.js';
import { edgeMediaBounds as __doeFn_edgeMediaBounds } from '../edge-media-bounds/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:2421
import { scope as __doeScope } from "../../runtime/context/index.js";

export function setEdgeMediaPosition(state, groupId, position, mediaRatio) {
    if (!__doeScope.EDGE_MEDIA_POSITIONS.includes(position)) return false;
    const location = (0, __doeFn_findLocation)(state.slide.blocks, groupId);
    if (!location || !(0, __doeFn_isEdgeSplitGroup)(location.node)) return false;
    const node = location.node;
    const previousPosition = (0, __doeFn_edgeMediaPosition)(node);
    const previousAxis = (0, __doeFn_edgeMediaAxis)(previousPosition);
    const nextAxis = (0, __doeFn_edgeMediaAxis)(position);
    const previousRatio = (0, __doeFn_normalizeEdgeMediaRatio)(
      node.layout.mediaRatio,
      previousPosition,
    );
    const candidateRatio =
      mediaRatio !== undefined
        ? mediaRatio
        : previousAxis !== nextAxis
          ? (0, __doeFn_edgeMediaBounds)(position).minimum
          : previousRatio;
    node.layout.variant = "edge-media";
    node.layout.mediaPosition = position;
    node.layout.mediaRatio = (0, __doeFn_normalizeEdgeMediaRatio)(
      candidateRatio,
      position,
    );
    node.layout.direction = nextAxis;
    node.layout.origin = "explicit";
    state.selectedId = node.id;
    return true;
  }
