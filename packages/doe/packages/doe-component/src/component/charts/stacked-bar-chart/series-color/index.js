// Origin: public/yrkie-doe/components/stacked-bar-chart/stacked-bar-chart.js:14
import { scope as __doeScope } from "../runtime/context/index.js";

export function seriesColor(_series, index) {
    return __doeScope.DEFAULT_SERIES_COLORS[index % __doeScope.DEFAULT_SERIES_COLORS.length];
  }
