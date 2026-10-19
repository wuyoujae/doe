// Origin: public/yrkie-doe/components/business-charts/business-charts.js:73
import { scope as __doeScope } from "../runtime/context/index.js";

export function svgFor(width, height) {
    return __doeScope.utils.svgElement("svg", {
      class: "ppt-business-chart__svg",
      viewBox: `0 0 ${width} ${height}`,
      preserveAspectRatio: "xMidYMid meet",
      "aria-hidden": "true",
    });
  }
