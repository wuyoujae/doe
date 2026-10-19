// Origin: public/yrkie-doe/components/competitive-landscape/competitive-landscape.js:7
import { scope as __doeScope } from "../runtime/context/index.js";

export function addLines(svg, lines, x, y, className, lineHeight, color) {
    const text = __doeScope.utils.svgElement("text", {
      x,
      y,
      class: className,
      style: color ? `fill: ${color}` : "",
    });
    lines.forEach((line, index) => {
      const tspan = __doeScope.utils.svgElement("tspan", { x, dy: index ? lineHeight : 0 });
      tspan.textContent = line;
      text.append(tspan);
    });
    svg.append(text);
  }
