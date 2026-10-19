// Origin: public/yrkie-doe/core/chart-utils.js:18
import { scope as __doeScope } from "../../../component/charts/shared/runtime/context/index.js";

export function svgElement(tagName, attributes) {
    const node = document.createElementNS(__doeScope.SVG_NS, tagName);
    Object.entries(attributes || {}).forEach(([name, value]) => {
      node.setAttribute(name, value);
    });
    return node;
  }
