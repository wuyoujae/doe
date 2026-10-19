// Origin: public/yrkie-doe/layout-engine/components.js:72
import { scope as __doeScope } from "../../../runtime/base/context/index.js";

export function initialize() {
__doeScope.MEDIA_ASPECT_RATIO_IDS = new Set([
    "auto",
    ...__doeScope.MEDIA_ASPECT_RATIO_PRESETS.map((preset) => preset.id),
  ]);
}
