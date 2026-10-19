import { hostFor as __doeFn_hostFor } from '../host-for/index.js';
import { svgFor as __doeFn_svgFor } from '../svg-for/index.js';
// Origin: public/yrkie-doe/components/business-charts/business-charts.js:245
import { scope as __doeScope } from "../runtime/context/index.js";

export function mountStackedArea(target, config) {
    const content = config?.content;
    if (!Array.isArray(content?.categories) || !Array.isArray(content.series) || !content.series.length) throw new Error("StackedAreaChart: categories and series are required.");
    content.series.forEach((series) => { if (series.data.length !== content.categories.length) throw new Error("StackedAreaChart: every series must match categories."); });
    const frame = (0, __doeFn_hostFor)(target, "StackedAreaChart", "ppt-stacked-area-chart", config, { width: 680, height: 430 });
    const svg = (0, __doeFn_svgFor)(frame.width, frame.svgHeight);
    const totals = content.categories.map((_, index) => content.series.reduce((sum, series) => sum + (Number(series.data[index]) || 0), 0));
    const scale = __doeScope.utils.niceScale(totals, { includeZero: true, minValue: content.minValue, maxValue: content.maxValue, tickInterval: content.tickInterval, targetTicks: 6 });
    const margin = { left: 45, right: 12, top: content.showLegend === false ? 10 : 38, bottom: 38 };
    const fieldWidth = frame.width - margin.left - margin.right;
    const fieldHeight = frame.svgHeight - margin.top - margin.bottom;
    const xFor = (index) => margin.left + (index / Math.max(1, content.categories.length - 1)) * fieldWidth;
    const yFor = (value) => margin.top + ((scale.maxValue - value) / (scale.maxValue - scale.minValue)) * fieldHeight;
    scale.ticks.forEach((tick) => {
      const y = yFor(tick);
      svg.append(__doeScope.utils.svgElement("line", { x1: margin.left, y1: y, x2: margin.left + fieldWidth, y2: y, class: "ppt-business-chart__grid" }));
      const label = __doeScope.utils.svgElement("text", { x: margin.left - 8, y: y + 5, "text-anchor": "end", class: "ppt-business-chart__tick" });
      label.textContent = __doeScope.utils.formatValue(tick, content);
      svg.append(label);
    });
    let cumulative = Array(content.categories.length).fill(0);
    content.series.forEach((series, seriesIndex) => {
      const lower = [...cumulative];
      cumulative = cumulative.map((value, index) => value + (Number(series.data[index]) || 0));
      const upperPoints = cumulative.map((value, index) => `${xFor(index)},${yFor(value)}`);
      const lowerPoints = lower.map((value, index) => `${xFor(index)},${yFor(value)}`).reverse();
      const color = (0, __doeScope.chartColor)(seriesIndex);
      svg.append(__doeScope.utils.svgElement("path", { d: `M ${upperPoints.join(" L ")} L ${lowerPoints.join(" L ")} Z`, fill: color, class: "ppt-business-chart__area" }));
      (series.labels || []).forEach((labelIndex) => {
        const value = Number(series.data[labelIndex]) || 0;
        const middle = lower[labelIndex] + value / 2;
        const label = __doeScope.utils.svgElement("text", { x: xFor(labelIndex), y: yFor(middle) + 5, class: "ppt-business-chart__value", style: `fill:${__doeScope.ON_PRIMARY_COLOR}` });
        label.textContent = __doeScope.utils.formatValue(value, content);
        svg.append(label);
      });
    });
    content.categories.forEach((category, index) => {
      const label = __doeScope.utils.svgElement("text", { x: xFor(index), y: margin.top + fieldHeight + 23, class: "ppt-business-chart__category" });
      label.textContent = category;
      svg.append(label);
    });
    if (content.showLegend !== false) {
      content.series.forEach((series, index) => {
        const x = margin.left + index * 155;
        svg.append(__doeScope.utils.svgElement("rect", { x, y: 7, width: 9, height: 9, fill: (0, __doeScope.chartColor)(index) }));
        const label = __doeScope.utils.svgElement("text", { x: x + 14, y: 16, class: "ppt-business-chart__legend" });
        label.textContent = series.name;
        svg.append(label);
      });
    }
    frame.host.append(svg);
    return { element: frame.host, size: { width: frame.width, height: frame.height } };
  }
