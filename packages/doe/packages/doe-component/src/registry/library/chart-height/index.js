import { clamp as __doeFn_clamp } from '../clamp/index.js';
// Origin: public/yrkie-doe/layout-engine/library-components.js:65
import { scope as __doeScope } from "../../runtime/library/context/index.js";

export function chartHeight(kind, width, density) {
    const scale = __doeScope.densityScale[density] || 1;
    const rules = {
      groupedBarChart: { ratio: 0.55, min: 300, max: 410 },
      lineChart: { ratio: 0.55, min: 310, max: 420 },
      // Stacked bars need the same visual slot as a structural chart: the
      // annotation curve, labels and stacked values should use the full height
      // of a paired row instead of leaving an empty lower half.
      stackedBarChart: { ratio: 0.72, min: 390, max: 480 },
      riskMatrix: { ratio: 0.72, min: 390, max: 480 },
      waterfallChart: { ratio: 0.38, min: 390, max: 480 },
      radarChart: { ratio: 0.72, min: 370, max: 470 },
      donutChart: { ratio: 0.72, min: 370, max: 470 },
    };
    const rule = rules[kind];
    return Math.round((0, __doeFn_clamp)(width * rule.ratio, rule.min, rule.max) * scale);
  }
