import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";
import { container as __doeFn_container } from "../../../../../runtimes/work-editor/component-gallery/container/index.js";

export function createScene() {
  return {
      id: "list-stacked-chart",
      name: "列表 + 堆叠柱图",
      schema: (0, __doeFn_slide)("list-stacked-chart", [
        (0, __doeFn_container)("stacked-row", "row", [
          {
            id: "mix-copy",
            type: "list",
            props: {
              title: "产品结构持续升级",
              items: ["无糖品类增长最快", "核心可乐保持稳定", "新品贡献逐年提高"],
            },
          },
          {
            id: "market-mix",
            type: "stacked-bar-chart",
            props: {
              content: {
                categories: ["2019", "2020", "2022", "2024E"],
                legendReversed: true,
                showValues: true,
                series: [
                  { name: "Cola", data: [48, 53, 57, 75] },
                  { name: "Sugar free", data: [5, 7, 10, 38] },
                  { name: "Other", data: [37, 38, 40, 43] },
                ],
                annotation: { label: "+9% p.a.", from: 0, to: 3 },
              },
            },
          },
        ]),
      ]),
    };
}
