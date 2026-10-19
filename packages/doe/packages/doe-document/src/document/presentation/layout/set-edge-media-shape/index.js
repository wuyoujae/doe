import { findLocation as __doeFn_findLocation } from '../../../../../../doe-core/src/operation/find-location/index.js';
import { isEdgeSplitGroup as __doeFn_isEdgeSplitGroup } from '../is-edge-split-group/index.js';
import { edgeMediaShape as __doeFn_edgeMediaShape } from '../edge-media-shape/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:2467
import { scope as __doeScope } from "../../runtime/context/index.js";

export function setEdgeMediaShape(state, groupId, shape) {
    if (!__doeScope.EDGE_MEDIA_SHAPES.includes(shape)) return false;
    const location = (0, __doeFn_findLocation)(state.slide.blocks, groupId);
    if (!location || !(0, __doeFn_isEdgeSplitGroup)(location.node)) return false;
    const node = location.node;
    if ((0, __doeFn_edgeMediaShape)(node) === shape) return false;
    node.layout.variant = "edge-media";
    node.layout.mediaShape = shape;
    node.layout.origin = "explicit";
    state.selectedId = node.id;
    return true;
  }
