// Origin: public/yrkie-doe/layout-engine/components.js:65
import { scope as __doeScope } from "../../../runtime/base/context/index.js";

export function initialize() {
__doeScope.MEDIA_ASPECT_RATIO_PRESETS = Object.freeze([
    Object.freeze({ id: "1:1", width: 1, height: 1 }),
    Object.freeze({ id: "4:3", width: 4, height: 3 }),
    Object.freeze({ id: "3:4", width: 3, height: 4 }),
    Object.freeze({ id: "16:9", width: 16, height: 9 }),
    Object.freeze({ id: "9:16", width: 9, height: 16 }),
  ]);
}
