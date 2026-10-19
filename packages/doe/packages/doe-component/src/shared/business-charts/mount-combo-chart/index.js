import { hostFor as __doeFn_hostFor } from '../host-for/index.js';
import { svgFor as __doeFn_svgFor } from '../svg-for/index.js';
// Origin: public/yrkie-doe/components/business-charts/business-charts.js:152
import { scope as __doeScope } from "../runtime/context/index.js";

export function mountComboChart(target, config) {
    const content = config?.content;
    if (!Array.isArray(content?.categories) || !Array.isArray(content.data) || content.categories.length !== content.data.length) throw new Error("ComboColumnLineChart: categories and data must match.");
    const frame = (0, __doeFn_hostFor)(target, "ComboColumnLineChart", "ppt-combo-chart", config, { width: 520, height: 480 });
    const svg = (0, __doeFn_svgFor)(frame.width, frame.svgHeight);
    const scale = __doeScope.utils.niceScale(content.data, { includeZero: true, minValue: content.minValue, maxValue: content.maxValue, tickInterval: content.tickInterval, targetTicks: 6 });
    const margin = { left: 48, right: content.showLegend ? 95 : 18, top: 14, bottom: 40 };
    const fieldWidth = frame.width - margin.left - margin.right;
    const fieldHeight = frame.svgHeight - margin.top - margin.bottom;
    const yFor = (value) => margin.top + ((scale.maxValue - value) / (scale.maxValue - scale.minValue)) * fieldHeight;
    const xFor = (index) => margin.left + ((index + 0.5) / content.categories.length) * fieldWidth;
    scale.ticks.forEach((tick) => {
      const y = yFor(tick);
      svg.append(__doeScope.utils.svgElement("line", { x1: margin.left, y1: y, x2: margin.left + fieldWidth, y2: y, class: "ppt-business-chart__grid" }));
      const label = __doeScope.utils.svgElement("text", { x: margin.left - 8, y: y + 5, "text-anchor": "end", class: "ppt-business-chart__tick" });
      label.textContent = __doeScope.utils.formatValue(tick, content);
      svg.append(label);
    });
    const barWidth = Math.min(38, fieldWidth / content.categories.length * 0.55);
    const points = [];
    content.categories.forEach((category, index) => {
      const x = xFor(index);
      const y = yFor(content.data[index]);
      const baseline = yFor(0);
      const color = (0, __doeScope.chartColor)(index);
      svg.append(__doeScope.utils.svgElement("rect", { x: x - barWidth / 2, y: Math.min(y, baseline), width: barWidth, height: Math.abs(baseline - y), fill: color }));
      const categoryLabel = __doeScope.utils.svgElement("text", { x, y: margin.top + fieldHeight + 23, class: "ppt-business-chart__category" });
      categoryLabel.textContent = category;
      svg.append(categoryLabel);
      points.push({ x, y });
    });
    svg.append(__doeScope.utils.svgElement("path", { d: __doeScope.utils.smoothPath(points, false), class: "ppt-business-chart__line" }));
    if (content.showLegend) {
      content.categories.forEach((category, index) => {
        const y = margin.top + 18 + index * 22;
        const color = (0, __doeScope.chartColor)(index);
        svg.append(__doeScope.utils.svgElement("rect", { x: margin.left + fieldWidth + 18, y: y - 9, width: 8, height: 8, fill: color }));
        const label = __doeScope.utils.svgElement("text", { x: margin.left + fieldWidth + 31, y, class: "ppt-business-chart__legend" });
        label.textContent = category;
        svg.append(label);
      });
    }
    frame.host.append(svg);
    return { element: frame.host, size: { width: frame.width, height: frame.height } };
  }
