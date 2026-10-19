import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";
import { container as __doeFn_container } from "../../../../../runtimes/work-editor/component-gallery/container/index.js";

export function createScene() {
  return {
      id: "gallery-advanced-charts",
      name: "组件展厅 5/8 · 结构图表",
      schema: (0, __doeFn_slide)("gallery-advanced-charts", [
        (0, __doeFn_container)(
          "gallery-advanced-chart-row",
          "row",
          [
            {
              id: "gallery-stacked-bar",
              type: "stacked-bar-chart",
              props: {
                showLegend: true,
                content: {
                  categories: ["2020", "2021", "2022", "2023", "2024"],
                  showValues: true,
                  series: [
                    { name: "Core", data: [48, 53, 57, 64, 75] },
                    { name: "New", data: [5, 7, 10, 22, 38] },
                    { name: "Other", data: [37, 38, 40, 41, 43] },
                  ],
                  annotation: {
                    label: "+9% p.a.",
                    from: 0,
                    to: 4,
                    curved: true,
                    curveLift: 22,
                  },
                },
              },
            },
            {
              id: "gallery-risk-matrix",
              type: "risk-matrix",
              props: {
                content: {
                  xLabel: "Impact",
                  yLabel: "Likelihood",
                  priorityZone: {
                    x: 0.55,
                    y: 0.4,
                    width: 0.4,
                    height: 0.55,
                    labelLines: ["Prioritized", "Risks"],
                  },
                  items: [
                    { label: "A", x: 0.84, y: 0.86 },
                    { label: "B", x: 0.76, y: 0.68 },
                    { label: "C", x: 0.9, y: 0.53 },
                    { label: "D", x: 0.62, y: 0.42 },
                    { label: "E", x: 0.2, y: 0.72 },
                    { label: "F", x: 0.16, y: 0.35 },
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
