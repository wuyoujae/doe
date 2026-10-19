import { hostFor as __doeFn_hostFor } from '../host-for/index.js';
import { svgFor as __doeFn_svgFor } from '../svg-for/index.js';
import { drawCartesian as __doeFn_drawCartesian } from '../draw-cartesian/index.js';
import { addLines as __doeFn_addLines } from '../add-lines/index.js';
// Origin: public/yrkie-doe/components/business-charts/business-charts.js:112
import { scope as __doeScope } from "../runtime/context/index.js";

export function mountForecastScatter(target, config) {
    const content = config?.content;
    if (!Array.isArray(content?.points) || !content.points.length) throw new Error("ForecastScatter: content.points is required.");
    const frame = (0, __doeFn_hostFor)(target, "ForecastScatter", "ppt-forecast-scatter", config, { width: 560, height: 480 });
    const svg = (0, __doeFn_svgFor)(frame.width, frame.svgHeight);
    const xValues = content.points.map((point) => Number(point.x));
    const yValues = content.points.map((point) => Number(point.y));
    const xScale = __doeScope.utils.niceScale(xValues, { includeZero: false, minValue: content.xMin, maxValue: content.xMax, tickInterval: content.xTickInterval, targetTicks: 6 });
    const yScale = __doeScope.utils.niceScale(yValues, { includeZero: content.includeZero !== false, minValue: content.yMin, maxValue: content.yMax, tickInterval: content.yTickInterval, targetTicks: 6 });
    const plot = (0, __doeFn_drawCartesian)(svg, { x: xScale, y: yScale }, { left: 48, right: 18, top: 12, bottom: 38 }, frame.width, frame.svgHeight, { showYAxis: content.showYAxis, xFormat: content.xFormat, yFormat: content });
    (content.notes || []).forEach((note) => {
      const lines = __doeScope.utils.wrapText(note.text || "", Number(note.width) || 300, `${note.bold ? `${__doeScope.SEMIBOLD_WEIGHT} ` : ""}14px ${__doeScope.FONT_STACK}`);
      (0, __doeFn_addLines)(svg, lines, plot.xFor(note.x), plot.yFor(note.y), "ppt-business-chart__note", 18, "start", note.color ? `fill:${note.color};font-weight:${note.bold ? 600 : 300}` : `font-weight:${note.bold ? 600 : 300}`);
    });
    content.points.forEach((point, pointIndex) => {
      const x = plot.xFor(point.x);
      const y = plot.yFor(point.y);
      const color = (0, __doeScope.chartColor)(pointIndex);
      svg.append(__doeScope.utils.svgElement("circle", { cx: x, cy: y, r: Number(point.radius) || 7, fill: color, class: "ppt-business-chart__point" }));
      if (point.label !== false) {
        const label = point.label ?? __doeScope.utils.formatValue(point.y, content);
        const labelWidth = __doeScope.utils.measureText(label, `14px ${__doeScope.FONT_STACK}`) + 10;
        svg.append(__doeScope.utils.svgElement("rect", { x: x + 8, y: y - 13, width: labelWidth, height: 26, class: "ppt-business-chart__value-box" }));
        const text = __doeScope.utils.svgElement("text", { x: x + 13, y: y + 5, class: "ppt-business-chart__value", style: "text-anchor:start" });
        text.textContent = label;
        svg.append(text);
      }
    });
    if (content.highlight) {
      const x = plot.xFor(content.highlight.x);
      const y = plot.yFor(content.highlight.y);
      svg.append(__doeScope.utils.svgElement("circle", { cx: x, cy: y, r: 9, fill: "none", stroke: __doeScope.PRIMARY_COLOR, "stroke-width": 4 }));
      const text = __doeScope.utils.svgElement("text", { x: x + 22, y: y + 5, class: "ppt-business-chart__note", style: `fill:${__doeScope.PRIMARY_COLOR};font-weight:${__doeScope.SEMIBOLD_WEIGHT}` });
      text.textContent = content.highlight.label || "Highlight";
      svg.append(text);
    }
    frame.host.append(svg);
    return { element: frame.host, size: { width: frame.width, height: frame.height } };
  }
