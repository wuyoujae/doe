// Origin: public/yrkie-doe/layout-engine/components.js:91
import { scope as __doeScope } from "../../runtime/base/context/index.js";

export function nearestMediaAspectRatio(heightPerWidth) {
    const target = Number(heightPerWidth);
    if (!Number.isFinite(target) || target <= 0) {
      return __doeScope.MEDIA_ASPECT_RATIO_PRESETS[3];
    }
    return __doeScope.MEDIA_ASPECT_RATIO_PRESETS.reduce((best, preset) => {
      const candidate = preset.height / preset.width;
      const bestDistance = Math.abs(
        Math.log(best.height / best.width) - Math.log(target),
      );
      const candidateDistance = Math.abs(Math.log(candidate) - Math.log(target));
      return candidateDistance < bestDistance ? preset : best;
    }, __doeScope.MEDIA_ASPECT_RATIO_PRESETS[0]);
  }
