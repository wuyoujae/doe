import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";
import { container as __doeFn_container } from "../../../../../runtimes/work-editor/component-gallery/container/index.js";

export function createScene() {
  return {
      id: "text-risk-matrix",
      name: "文字 + 风险矩阵",
      schema: (0, __doeFn_slide)("text-risk-matrix", [
        (0, __doeFn_container)("risk-row", "row", [
          {
            id: "risk-copy",
            type: "list",
            props: {
              title: "优先处理右上象限",
              items: [
                "监管变化影响交付周期",
                "供应链集中度仍然偏高",
                "客户迁移成本正在下降",
              ],
            },
          },
          (0, __doeFn_container)(
            "risk-map-stack",
            "stack",
            [
              {
                id: "risk-map",
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
              {
                id: "risk-map-source",
                type: "text",
                props: {
                  text: "Source: Internal risk review",
                },
              },
            ],
            { gap: "6pt" },
          ),
        ]),
      ]),
    };
}
