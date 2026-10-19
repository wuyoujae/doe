// Origin: public/yrkie-doe/components/dashboard-widgets/dashboard-widgets.js:77
import { scope as __doeScope } from "../runtime/context/index.js";

export function svgText(svg, options) {
    const node = __doeScope.utils.svgElement("text", {
      x: options.x,
      y: options.y,
      class: options.className || "",
      "text-anchor": options.anchor || "middle",
      style: options.style || "",
    });
    node.textContent = options.text;
    svg.append(node);
    return node;
  }
