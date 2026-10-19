// Origin: public/yrkie-doe/core/theme.js:131
import { scope as __doeScope } from "../../runtime/context/index.js";

export function chartColor(index) {
    const palette = __doeScope.YRKIE_THEME.colors.chart;
    const position = Number.isFinite(Number(index)) ? Math.max(0, Math.trunc(Number(index))) : 0;
    return palette[position % palette.length];
  }
