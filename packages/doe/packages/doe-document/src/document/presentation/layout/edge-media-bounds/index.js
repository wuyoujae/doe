import { edgeMediaAxis as __doeFn_edgeMediaAxis } from '../edge-media-axis/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:752
import { scope as __doeScope } from "../../runtime/context/index.js";

export function edgeMediaBounds(position) {
    return __doeScope.EDGE_MEDIA_RATIO_BOUNDS[(0, __doeFn_edgeMediaAxis)(position)];
  }
