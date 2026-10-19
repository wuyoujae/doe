// Origin: public/yrkie-doe/components/waterfall-chart/waterfall-chart.js:75
import { scope as __doeScope } from "../runtime/context/index.js";

export function appendMultilineText(parent, options) {
    const text = __doeScope.utils.svgElement("text", {
      x: options.x,
      y: options.y,
      class: options.className,
      "text-anchor": options.anchor || "start",
    });
    options.lines.forEach((line, index) => {
      const tspan = __doeScope.utils.svgElement("tspan", {
        x: options.x,
        dy: index === 0 ? 0 : options.lineHeight,
      });
      tspan.textContent = line;
      text.append(tspan);
    });
    parent.append(text);
    return text;
  }
