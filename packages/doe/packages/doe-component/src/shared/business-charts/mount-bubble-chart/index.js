import { hostFor as __doeFn_hostFor } from '../host-for/index.js';
import { svgFor as __doeFn_svgFor } from '../svg-for/index.js';
import { drawCartesian as __doeFn_drawCartesian } from '../draw-cartesian/index.js';
import { addLines as __doeFn_addLines } from '../add-lines/index.js';
// Origin: public/yrkie-doe/components/business-charts/business-charts.js:198
import { scope as __doeScope } from "../runtime/context/index.js";

export function mountBubbleChart(target, config) {
    const content = config?.content;
    if (!Array.isArray(content?.points) || !content.points.length) throw new Error("BubbleChart: content.points is required.");
    const frame = (0, __doeFn_hostFor)(target, "BubbleChart", "ppt-bubble-chart", config, { width: 1180, height: 650 });
    const svg = (0, __doeFn_svgFor)(frame.width, frame.svgHeight);
    const panelWidth = content.sidePanel ? Math.min(360, frame.width * 0.3) : 0;
    const xScale = __doeScope.utils.niceScale(content.points.map((point) => point.x), { includeZero: false, minValue: content.xMin, maxValue: content.xMax, tickInterval: content.xTickInterval, targetTicks: 8 });
    const yScale = __doeScope.utils.niceScale(content.points.map((point) => point.y), { includeZero: true, minValue: content.yMin, maxValue: content.yMax, tickInterval: content.yTickInterval, targetTicks: 7 });
    const plot = (0, __doeFn_drawCartesian)(svg, { x: xScale, y: yScale }, { left: 52, right: panelWidth + 18, top: 28, bottom: 40 }, frame.width, frame.svgHeight, { showYAxis: true, xFormat: content.xFormat, yFormat: content.yFormat });
    const groups = content.groups || {};
    const groupNames = Object.keys(groups);
    content.points.forEach((point, pointIndex) => {
      const x = plot.xFor(point.x);
      const y = plot.yFor(point.y);
      const radius = __doeScope.utils.clamp(Number(point.radius) || Math.sqrt(Math.max(1, Number(point.size) || 1)) * 5, 8, 78);
      const groupIndex = Math.max(0, groupNames.indexOf(point.group));
      const color = (0, __doeScope.chartColor)(groupNames.length ? groupIndex : pointIndex);
      svg.append(__doeScope.utils.svgElement("circle", { cx: x, cy: y, r: radius, fill: color, opacity: point.opacity ?? 0.95 }));
      if (point.primary) svg.append(__doeScope.utils.svgElement("circle", { cx: x, cy: y, r: radius + 1, class: "ppt-business-chart__bubble-outline" }));
      if (point.netExporter) svg.append(__doeScope.utils.svgElement("circle", { cx: x, cy: y, r: radius + 5, class: "ppt-business-chart__bubble-outline ppt-business-chart__bubble-outline--dashed" }));
      const label = __doeScope.utils.svgElement("text", {
        x: x + (point.labelDx ?? radius + 7),
        y: y + (point.labelDy ?? 5),
        class: "ppt-business-chart__bubble-label",
        style: `fill:${__doeScope.BODY_COLOR};text-anchor:${point.labelAnchor || "start"}`,
      });
      label.textContent = point.label;
      svg.append(label);
    });
    Object.entries(groups).forEach(([name, group], index) => {
      const x = frame.width - panelWidth - 170 + (index % 2) * 90;
      const y = 14 + Math.floor(index / 2) * 22;
      svg.append(__doeScope.utils.svgElement("circle", { cx: x, cy: y, r: 8, fill: (0, __doeScope.chartColor)(index) }));
      const label = __doeScope.utils.svgElement("text", { x: x + 14, y: y + 5, class: "ppt-business-chart__legend" });
      label.textContent = name;
      svg.append(label);
    });
    if (content.sidePanel) {
      const panelX = frame.width - panelWidth + 18;
      (0, __doeFn_addLines)(svg, __doeScope.utils.wrapText(content.sidePanel.title || "", panelWidth - 36, `italic ${__doeScope.SEMIBOLD_WEIGHT} 24px ${__doeScope.FONT_STACK}`), panelX, 86, "ppt-business-chart__panel-title", 29);
      (0, __doeFn_addLines)(svg, __doeScope.utils.wrapText(content.sidePanel.meta || "", panelWidth - 36, `16px ${__doeScope.FONT_STACK}`), panelX, 145, "ppt-business-chart__panel-meta", 20, "start", `fill:${__doeScope.BODY_COLOR}`);
      (0, __doeFn_addLines)(svg, __doeScope.utils.wrapText(content.sidePanel.body || "", panelWidth - 36, `16px ${__doeScope.FONT_STACK}`), panelX, 225, "ppt-business-chart__panel-body", 20);
    }
    frame.host.append(svg);
    return { element: frame.host, size: { width: frame.width, height: frame.height } };
  }
