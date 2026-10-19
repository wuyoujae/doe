// Origin: public/yrkie-doe/components/business-charts/business-charts.js:57
import { scope as __doeScope } from "../runtime/context/index.js";

export function addLines(svg, lines, x, y, className, lineHeight, anchor, style) {
    const text = __doeScope.utils.svgElement("text", {
      x,
      y,
      class: className,
      "text-anchor": anchor || "start",
      style: style || "",
    });
    lines.forEach((line, index) => {
      const tspan = __doeScope.utils.svgElement("tspan", { x, dy: index ? lineHeight : 0 });
      tspan.textContent = line;
      text.append(tspan);
    });
    svg.append(text);
  }
