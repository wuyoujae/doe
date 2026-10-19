// Origin: public/yrkie-doe/work-editor/component-gallery.js:124
import { scope as __doeScope } from "../../../../../studio/gallery/chinese/runtime/context/index.js";

export function initialize() {
__doeScope.growthBars = {
    id: "growth-bars",
    type: "grouped-bar-chart",
    props: {
      showLegend: true,
      content: {
        valueSuffix: "%",
        categories: ["Q1", "Q2", "Q3", "Q4"],
        series: [
          { name: "Enterprise", data: [42, 48, 55, 63] },
          { name: "Consumer", data: [31, 34, 38, 41] },
        ],
      },
    },
  };
}
