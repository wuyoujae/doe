// Origin: public/yrkie-doe/components/waterfall-chart/waterfall-chart.js:166
import { scope as __doeScope } from "../runtime/context/index.js";

export function calculateScale(content, steps) {
    const values = steps.flatMap((step) => [step.start, step.end]);
    return __doeScope.utils.niceScale(values, {
      includeZero: content.includeZero !== false,
      minValue: Number.isFinite(content.minValue) ? content.minValue : undefined,
      maxValue: Number.isFinite(content.maxValue) ? content.maxValue : undefined,
      tickInterval: content.tickInterval,
      targetTicks: 7,
    });
  }
