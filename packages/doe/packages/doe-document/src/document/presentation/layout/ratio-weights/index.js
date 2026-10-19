import { preferredCompressionWidth as __doeFn_preferredCompressionWidth } from '../preferred-compression-width/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:614
import { scope as __doeScope } from "../../runtime/context/index.js";

export function ratioWeights(profiles, ratio = "auto") {
    if (
      Array.isArray(ratio) &&
      ratio.length === profiles.length &&
      ratio.every((weight) => Number.isFinite(Number(weight)) && Number(weight) > 0)
    ) {
      return ratio.map(Number);
    }
    const preset = __doeScope.COMPOSITION_RATIOS[ratio];
    if (preset && preset.length === profiles.length) return [...preset];
    return profiles.map((profile) => (0, __doeFn_preferredCompressionWidth)(profile));
  }
