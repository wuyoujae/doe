import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";
import { container as __doeFn_container } from "../../../../../runtimes/work-editor/component-gallery/container/index.js";

export function createScene() {
  return {
      id: "gallery-core-charts",
      name: "组件展厅 4/8 · 柱线图表",
      schema: (0, __doeFn_slide)("gallery-core-charts", [
        (0, __doeFn_container)(
          "gallery-core-chart-row",
          "row",
          [
            {
              id: "gallery-grouped-bar",
              type: "grouped-bar-chart",
              props: {
                showLegend: true,
                content: {
                  valueSuffix: "M",
                  categories: ["2022", "2023", "2024", "2025E"],
                  series: [
                    { name: "Core", data: [248, 278, 309, 371] },
                    { name: "Growth", data: [163, 162, 170, 240] },
                  ],
                },
              },
            },
            {
              id: "gallery-line",
              type: "line-chart",
              props: {
                subtitle: "EBIT margin forecast",
                showLegend: true,
                smooth: true,
                content: {
                  valueSuffix: "%",
                  categories: ["FY2", "FY3", "FY4", "FY5", "FY6"],
                  series: [
                    { name: "Base", data: [2, -8, 31, 42, 47] },
                    { name: "Upside", data: [4, 0, 27, 55, 61] },
                  ],
                },
              },
            },
          ],
          { ratio: "balanced", gap: "18pt" },
        ),
      ]),
    };
}
