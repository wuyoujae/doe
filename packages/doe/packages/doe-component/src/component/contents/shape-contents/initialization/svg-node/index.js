// Origin: public/yrkie-doe/components/shape-contents/shape-contents.js:6
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.svgNode = (name, attrs = {}) => {
    const node = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value)); return node;
  };
}
