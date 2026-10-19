import { attachChartInteraction } from '../../chart/tooltip/runtime/index.js';
import { hostFor as __doeFn_hostFor } from '../host-for/index.js';
import { svgFor as __doeFn_svgFor } from '../svg-for/index.js';
import { polar as __doeFn_polar } from '../polar/index.js';
import { typographyPixelSize as __doeFn_typographyPixelSize } from '../typography-pixel-size/index.js';
// Origin: public/yrkie-doe/components/business-charts/business-charts.js:299
import { scope as __doeScope } from "../runtime/context/index.js";

export function mountRadar(target, config) {
    const content = config?.content;
    if (!Array.isArray(content?.axes) || content.axes.length < 3 || !Array.isArray(content.datasets) || !content.datasets.length) throw new Error("RadarChart: at least three axes and one dataset are required.");
    const frame = (0, __doeFn_hostFor)(target, "RadarChart", "ppt-radar-chart", config, { width: 560, height: 430 });
    const showLegend = content.showLegend !== false;
    const legendHeight = showLegend ? 31 : 0;
    const plotHeight = Math.max(180, frame.svgHeight - legendHeight);
    const svg = (0, __doeFn_svgFor)(frame.width, plotHeight);
    const cx = frame.width * 0.5;
    const cy = plotHeight * 0.5;
    const radius = Math.min(frame.width * 0.31, plotHeight * 0.36);
    const axisCount = content.axes.length;
    const pointAt = (index, ratio) => (0, __doeFn_polar)(cx, cy, radius * ratio, index * (360 / axisCount));
    const rings = Number(content.rings) || 3;
    for (let ring = 1; ring <= rings; ring += 1) {
      const points = content.axes.map((_, index) => pointAt(index, ring / rings));
      svg.append(__doeScope.utils.svgElement("polygon", { points: points.map((point) => `${point.x},${point.y}`).join(" "), class: "ppt-business-chart__radar-grid" }));
    }
    content.axes.forEach((axis, index) => {
      const end = pointAt(index, 1.08);
      svg.append(__doeScope.utils.svgElement("line", { x1: cx, y1: cy, x2: end.x, y2: end.y, class: "ppt-business-chart__radar-axis" }));
      const labelPoint = pointAt(index, 1.28);
      const label = __doeScope.utils.svgElement("text", { x: labelPoint.x, y: labelPoint.y + 5, class: "ppt-business-chart__radar-label", "text-anchor": "middle" });
      const side = Math.abs(labelPoint.x - cx) > radius * 0.25 ? (labelPoint.x > cx ? 1 : -1) : 0;
      const labelWidth = Math.max(24, Math.min(180, side > 0 ? frame.width - labelPoint.x - 8 : side < 0 ? labelPoint.x - 8 : frame.width - 16));
      const lineHeight = (0, __doeFn_typographyPixelSize)(frame.host, "normal") * 1.2;
      const lines = __doeScope.utils.wrapText(axis.label, labelWidth, `${(0, __doeFn_typographyPixelSize)(frame.host, "normal")}px ${__doeScope.FONT_STACK}`);
      if (lines.length > 1 && side) label.setAttribute("text-anchor", side > 0 ? "start" : "end");
      label.setAttribute("y", String(Math.max(lineHeight, Math.min(plotHeight - (lines.length - 1) * lineHeight - 4, labelPoint.y + 5 - (lines.length - 1) * lineHeight / 2))));
      lines.forEach((line, i) => {
        const span = __doeScope.utils.svgElement("tspan", { x: labelPoint.x, dy: i ? lineHeight : 0 });
        span.textContent = line; label.append(span);
      });
      svg.append(label);
    });
    content.datasets.forEach((dataset, datasetIndex) => {
      const points = content.axes.map((axis, index) => pointAt(index, __doeScope.utils.clamp((Number(dataset.values[index]) || 0) / (Number(axis.max) || 1), 0, 1)));
      const color = __doeScope.RADAR_DEFAULT_COLORS[datasetIndex % __doeScope.RADAR_DEFAULT_COLORS.length];
      svg.append(__doeScope.utils.svgElement("polygon", { points: points.map((point) => `${point.x},${point.y}`).join(" "), fill: color, opacity: dataset.fillOpacity ?? 0.85 }));
      points.forEach((point) => svg.append(__doeScope.utils.svgElement("circle", { cx: point.x, cy: point.y, r: 5, fill: color, class: "ppt-business-chart__radar-point" })));
    });
    frame.host.append(svg);
    if (showLegend) {
      const legend = __doeScope.utils.element("ul", "ppt-radar-chart__legend");
      legend.setAttribute("aria-label", "Data series");
      content.datasets.forEach((dataset, index) => {
        const entry = __doeScope.utils.element("li", "ppt-radar-chart__legend-item");
        const swatch = __doeScope.utils.element("span", "ppt-radar-chart__legend-swatch");
        swatch.style.background = __doeScope.RADAR_DEFAULT_COLORS[index % __doeScope.RADAR_DEFAULT_COLORS.length];
        entry.append(swatch, document.createTextNode(dataset.name || `Series ${index + 1}`));
        legend.append(entry);
      });
      frame.host.append(legend);
    }
    attachChartInteraction(frame.host, config, 'radar-chart');

    return { element: frame.host, size: { width: frame.width, height: frame.height } };
  }
