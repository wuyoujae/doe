import { niceStep as __doeFn_niceStep } from '../nice-step/index.js';
// Origin: public/yrkie-doe/components/grouped-bar-chart/grouped-bar-chart.js:68


export function calculateScale(content) {
    const values = content.series.flatMap((series) => series.data).map(Number);
    const dataMax = Math.max(0, ...values);
    const requestedMax = Number(content.maxValue);
    const requestedInterval = Number(content.tickInterval);
    const basis = Math.max(dataMax, requestedMax > 0 ? requestedMax : 0);
    const interval = requestedInterval > 0 && basis / requestedInterval <= 100 ? requestedInterval : (0, __doeFn_niceStep)(basis);
    const maxValue = Math.max(
      interval,
      Math.ceil(basis / interval) * interval
    );
    const tickCount = Math.round(maxValue / interval);
    const ticks = Array.from(
      { length: tickCount + 1 },
      (_, index) => maxValue - index * interval
    );

    return { maxValue, interval, ticks };
  }
