import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";
import { container as __doeFn_container } from "../../../../../runtimes/work-editor/component-gallery/container/index.js";

export function createScene() {
  return {
      id: "text-waterfall",
      name: "文字 + 瀑布图",
      schema: (0, __doeFn_slide)("text-waterfall", [
        (0, __doeFn_container)("waterfall-row", "row", [
          {
            id: "waterfall-copy",
            type: "text",
            props: {
              title: "投资增长由少数赛道驱动",
              text: "消费科技与医疗健康贡献主要增量。瀑布图的最小宽度高于普通图表，空间不足时容器会自动改成上下排列，而不是压坏标签。",
            },
          },
          {
            id: "investment-waterfall",
            type: "waterfall-chart",
            props: {
              content: {
                minValue: 0,
                maxValue: 70,
                tickInterval: 10,
                items: [
                  { label: "2020", type: "total", value: 36, valuePosition: "above" },
                  { label: "Telecom", value: -2 },
                  { label: "Energy", value: -1 },
                  { label: "Healthcare", value: 6 },
                  { label: "SaaS", value: 8 },
                  { label: "Consumer tech", value: 23 },
                  { label: "2023", type: "total", value: 70, valuePosition: "inside" },
                ],
              },
            },
          },
        ]),
      ]),
    };
}
