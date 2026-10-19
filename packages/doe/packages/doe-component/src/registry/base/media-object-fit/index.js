import { normalizeMediaFit as __doeFn_normalizeMediaFit } from '../normalize-media-fit/index.js';
// Origin: public/yrkie-doe/layout-engine/components.js:82


export function mediaObjectFit(value) {
    const fit = (0, __doeFn_normalizeMediaFit)(value);
    if (fit === "fill") return "fill";
    if (fit === "auto" || fit === "natural" || fit === "contain") {
      return "contain";
    }
    return "cover";
  }
