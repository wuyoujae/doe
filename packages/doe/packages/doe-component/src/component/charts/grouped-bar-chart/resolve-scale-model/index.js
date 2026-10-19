import { median as __doeFn_median } from '../median/index.js';
// Origin: public/yrkie-doe/components/grouped-bar-chart/grouped-bar-chart.js:104


export function resolveScaleModel(content) {
    const series = content.series || [];
    // A shared unit (or no explicit per-series unit) means absolute values.
    // Magnitude differences alone cannot establish that the units differ.
    const units = series.map((item) => String(item.name || '').match(/[（(]([^（）()]+)[）)]\s*$/)?.[1]);
    const mixedUnits = !content.valuePrefix && !content.valueSuffix &&
      units.every(Boolean) && new Set(units).size > 1;
    const canIndex =
      mixedUnits &&
      !Number(content.maxValue) &&
      !Number(content.tickInterval) &&
      (content.categories || []).length >= 2 &&
      series.length >= 2 &&
      series.every((item) => Number(item.data?.[0]) > 0);
    const typicalValues = series.map((item) => (0, __doeFn_median)(item.data)).filter(Boolean);
    const magnitudeRatio = typicalValues.length
      ? Math.max(...typicalValues) /
        Math.max(Number.EPSILON, Math.min(...typicalValues))
      : 1;
    if (!canIndex || magnitudeRatio < 50) {
      return {
        mode: "absolute",
        plotSeries: series.map((item) => ({
          ...item,
          plotData: item.data.map(Number),
        })),
      };
    }
    return {
      mode: "series-index",
      plotSeries: series.map((item) => {
        const baseline = Number(item.data[0]);
        return {
          ...item,
          plotData: item.data.map((value) => (Number(value) / baseline) * 100),
        };
      }),
    };
  }
