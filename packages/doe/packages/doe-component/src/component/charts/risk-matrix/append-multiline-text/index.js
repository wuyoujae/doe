// Origin: public/yrkie-doe/components/risk-matrix/risk-matrix.js:38
import { scope as __doeScope } from "../runtime/context/index.js";

export function appendMultilineText(parent, lines, x, centerY, lineHeight, className) {
    const text = __doeScope.utils.svgElement("text", { x, y: centerY, class: className });
    const startY = centerY - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, index) => {
      const tspan = __doeScope.utils.svgElement("tspan", {
        x,
        y: startY + index * lineHeight,
      });
      tspan.textContent = line;
      text.append(tspan);
    });
    parent.append(text);
  }
