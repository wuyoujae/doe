// Origin: public/yrkie-doe/components/line-chart/line-chart.js:11
import { scope as __doeScope } from "../runtime/context/index.js";

export function resolveSeriesColor(_series, index) {
    return __doeScope.DEFAULT_SERIES_COLORS[index % __doeScope.DEFAULT_SERIES_COLORS.length];
  }
