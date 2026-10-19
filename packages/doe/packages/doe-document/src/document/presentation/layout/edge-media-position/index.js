import { isEdgeSplitGroup as __doeFn_isEdgeSplitGroup } from '../is-edge-split-group/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:2396
import { scope as __doeScope } from "../../runtime/context/index.js";

export function edgeMediaPosition(node) {
    if (!(0, __doeFn_isEdgeSplitGroup)(node)) return null;
    if (__doeScope.EDGE_MEDIA_POSITIONS.includes(node.layout?.mediaPosition)) {
      return node.layout.mediaPosition;
    }
    const mediaIndex = node.children.findIndex(
      (child) => child.layout?.region === "media",
    );
    return mediaIndex === 0 ? "left" : "right";
  }
