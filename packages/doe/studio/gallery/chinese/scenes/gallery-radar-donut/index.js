import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";
import { container as __doeFn_container } from "../../../../../runtimes/work-editor/component-gallery/container/index.js";

export function createScene() {
  return {
      id: "gallery-radar-donut",
      name: "组件展厅 9/12 · 雷达图与环形图",
      schema: (0, __doeFn_slide)("gallery-radar-donut", [
        (0, __doeFn_container)(
          "gallery-radar-donut-row",
          "row",
          [
            {
              id: "gallery-radar-chart",
              type: "radar-chart",
              props: {
                content: {
                  showLegend: true,
                  rings: 4,
                  axes: [
                    { label: "产品", max: 100 },
                    { label: "渠道", max: 100 },
                    { label: "交付", max: 100 },
                    { label: "效率", max: 100 },
                    { label: "创新", max: 100 },
                  ],
                  datasets: [
                    { name: "本期", values: [86, 74, 82, 78, 90] },
                    { name: "行业", values: [72, 81, 68, 84, 70] },
                  ],
                },
              },
            },
            {
              id: "gallery-donut-chart",
              type: "donut-chart",
              props: {
                content: {
                  variant: "standard",
                  showLegend: true,
                  holeRatio: 0.5,
                  valueSuffix: "%",
                  center: { eyebrow: "TOTAL", value: "100%", subtitle: "年度收入" },
                  items: [
                    { label: "核心业务", value: 46 },
                    { label: "云与算力", value: 28 },
                    { label: "物联网", value: 16 },
                    { label: "其他", value: 10 },
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
