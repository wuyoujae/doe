// Origin: public/yrkie-doe/layout-engine/layout-engine.js:7336
import { scope as __doeScope } from "../../runtime/context/index.js";

export function compositionDensityId(
    globalDensityId,
    _structuralScale,
    allowMicroText = false,
  ) {
    // A narrower track is a wrapping signal, not a typography signal. Keep
    // the current semantic size while measuring the wrapped result; only the
    // outer density solver may step typography down after the real width and
    // height measurements prove that the current density cannot fit.
    const globalIndex = Math.max(
      0,
      __doeScope.DENSITIES.findIndex((density) => density.id === globalDensityId),
    );
    const resolvedIndex = globalIndex;
    return __doeScope.DENSITIES[resolvedIndex]?.id || "tight";
  }
