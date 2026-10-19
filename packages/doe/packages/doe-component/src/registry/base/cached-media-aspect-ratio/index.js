import { resolveMediaAspectRatio as __doeFn_resolveMediaAspectRatio } from '../resolve-media-aspect-ratio/index.js';
// Origin: public/yrkie-doe/layout-engine/components.js:125
import { scope as __doeScope } from "../../runtime/base/context/index.js";

export function cachedMediaAspectRatio(component) {
    const source = String(component.props.src || "").trim();
    const cached = source ? __doeScope.MEDIA_INTRINSIC_RATIO_CACHE.get(source) : null;
    return (0, __doeFn_resolveMediaAspectRatio)(
      component.props.aspectRatio,
      cached?.width,
      cached?.height,
    );
  }
