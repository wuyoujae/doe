// Origin: public/yrkie-doe/components/grouped-bar-chart/grouped-bar-chart.js:22
import { scope as __doeScope } from "../runtime/context/index.js";

export function svgElement(tagName, attributes) {
    const node = document.createElementNS(__doeScope.SVG_NS, tagName);
    Object.entries(attributes).forEach(([name, value]) => {
      node.setAttribute(name, value);
    });
    return node;
  }
