// Origin: public/yrkie-doe/components/shape-contents/shape-contents.js:10
import { scope as __doeScope } from "../runtime/context/index.js";

export function art(width, height) {
    return (0, __doeScope.svgNode)("svg", { viewBox: `0 0 ${width} ${height}`, class: "shape-contents__art", "aria-hidden": "true" });
  }
