import { nearestMediaAspectRatio as __doeFn_nearestMediaAspectRatio } from '../nearest-media-aspect-ratio/index.js';
// Origin: public/yrkie-doe/layout-engine/components.js:106
import { scope as __doeScope } from "../../runtime/base/context/index.js";

export function resolveMediaAspectRatio(value, naturalWidth = 0, naturalHeight = 0) {
    const requested = String(value || "auto").trim().toLowerCase();
    const explicit = __doeScope.MEDIA_ASPECT_RATIO_PRESETS.find(
      (preset) => preset.id === requested,
    );
    if (explicit) return explicit;

    const numeric = Number(value);
    if (requested !== "auto" && Number.isFinite(numeric) && numeric > 0) {
      // v4.15 and earlier stored aspectRatio as height / width. Snap legacy
      // values to the supported presentation-safe ratio set.
      return (0, __doeFn_nearestMediaAspectRatio)(numeric);
    }
    if (Number(naturalWidth) > 0 && Number(naturalHeight) > 0) {
      return (0, __doeFn_nearestMediaAspectRatio)(Number(naturalHeight) / Number(naturalWidth));
    }
    return __doeScope.MEDIA_ASPECT_RATIO_PRESETS[3];
  }
