import { niceStep as __doeFn_niceStep } from '../nice-step/index.js';
// Origin: public/yrkie-doe/core/chart-utils.js:52


export function niceScale(values, options) {
    const settings = options || {};
    const finiteValues = values.map(Number).filter(Number.isFinite);
    let rawMin = finiteValues.length ? Math.min(...finiteValues) : 0;
    let rawMax = finiteValues.length ? Math.max(...finiteValues) : 1;

    if (settings.includeZero !== false) {
      rawMin = Math.min(0, rawMin);
      rawMax = Math.max(0, rawMax);
    }

    if (Number.isFinite(settings.minValue)) rawMin = settings.minValue;
    if (Number.isFinite(settings.maxValue)) rawMax = settings.maxValue;
    if (rawMax === rawMin) rawMax = rawMin + 1;

    const interval =
      Number(settings.tickInterval) > 0
        ? Number(settings.tickInterval)
        : (0, __doeFn_niceStep)(rawMax - rawMin, settings.targetTicks || 5);
    const minValue = Math.floor(rawMin / interval) * interval;
    const maxValue = Math.ceil(rawMax / interval) * interval;
    const tickCount = Math.round((maxValue - minValue) / interval);
    const ticks = Array.from(
      { length: tickCount + 1 },
      (_, index) => maxValue - index * interval
    );

    return { minValue, maxValue, interval, ticks };
  }
