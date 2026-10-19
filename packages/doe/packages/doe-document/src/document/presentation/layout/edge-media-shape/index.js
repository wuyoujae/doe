import { isEdgeSplitGroup as __doeFn_isEdgeSplitGroup } from '../is-edge-split-group/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:2407
import { scope as __doeScope } from "../../runtime/context/index.js";

export function edgeMediaShape(node) {
    if (!(0, __doeFn_isEdgeSplitGroup)(node)) return null;
    return __doeScope.EDGE_MEDIA_SHAPES.includes(node.layout?.mediaShape)
      ? node.layout.mediaShape
      : "straight";
  }
