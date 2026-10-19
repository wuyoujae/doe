// Origin: public/yrkie-doe/layout-engine/layout-engine.js:5388
import { scope as __doeScope } from "../../runtime/context/index.js";

export function liveTextFloorPx(node, baseFontPx) {
    let floorPt = 12;
    if (node.type === "heading") {
      floorPt = Number(node.props?.level) === 1 ? 36 : 21;
    }
    return Math.min(baseFontPx, floorPt * __doeScope.CSS_PIXELS_PER_POINT);
  }
