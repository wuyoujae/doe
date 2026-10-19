// Origin: public/yrkie-doe/components/business-charts/business-charts.js:82
import { scope as __doeScope } from "../runtime/context/index.js";

export function drawCartesian(svg, scales, margin, width, height, options) {
    const fieldWidth = width - margin.left - margin.right;
    const fieldHeight = height - margin.top - margin.bottom;
    const xSpan = scales.x.maxValue - scales.x.minValue;
    const ySpan = scales.y.maxValue - scales.y.minValue;
    const xFor = (value) => margin.left + ((value - scales.x.minValue) / xSpan) * fieldWidth;
    const yFor = (value) => margin.top + ((scales.y.maxValue - value) / ySpan) * fieldHeight;
    scales.y.ticks.forEach((tick) => {
      const y = yFor(tick);
      svg.append(__doeScope.utils.svgElement("line", { x1: margin.left, y1: y, x2: margin.left + fieldWidth, y2: y, class: "ppt-business-chart__grid" }));
      if (options.showYAxis !== false) {
        const label = __doeScope.utils.svgElement("text", { x: margin.left - 8, y: y + 5, "text-anchor": "end", class: "ppt-business-chart__tick" });
        label.textContent = __doeScope.utils.formatValue(tick, options.yFormat || {});
        svg.append(label);
      }
    });
    scales.x.ticks.forEach((tick) => {
      const x = xFor(tick);
      if (options.verticalGrid !== false) svg.append(__doeScope.utils.svgElement("line", { x1: x, y1: margin.top, x2: x, y2: margin.top + fieldHeight, class: "ppt-business-chart__grid" }));
      const label = __doeScope.utils.svgElement("text", { x, y: margin.top + fieldHeight + 22, class: "ppt-business-chart__category", "text-anchor": "middle" });
      label.textContent = __doeScope.utils.formatValue(tick, options.xFormat || {});
      svg.append(label);
    });
    svg.append(
      __doeScope.utils.svgElement("line", { x1: margin.left, y1: margin.top + fieldHeight, x2: margin.left + fieldWidth, y2: margin.top + fieldHeight, class: "ppt-business-chart__axis" }),
      __doeScope.utils.svgElement("line", { x1: margin.left, y1: margin.top, x2: margin.left, y2: margin.top + fieldHeight, class: "ppt-business-chart__axis" })
    );
    return { xFor, yFor, fieldWidth, fieldHeight };
  }
