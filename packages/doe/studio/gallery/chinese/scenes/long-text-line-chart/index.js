import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";
import { container as __doeFn_container } from "../../../../../runtimes/work-editor/component-gallery/container/index.js";

export function createScene() {
  return {
      id: "long-text-line-chart",
      name: "长文字 + 折线图",
      schema: (0, __doeFn_slide)("long-text-line-chart", [
        (0, __doeFn_container)(
          "long-copy-row",
          "row",
          [
            (0, __doeFn_container)(
              "long-copy-stack",
              "stack",
              [
                {
                  id: "long-copy",
                  type: "text",
                  props: {
                    title: "增长来自结构改善，而不是短期价格波动",
                    text: "过去六个季度，企业客户、公共事业客户与渠道伙伴共同贡献了新增收入。系统会先重新分配轨道宽度与间距，再让正文自然换行；只有用户在组合工具条中明确选择“允许 8pt”时，超长正文才会继续压缩。标题仍保持 21pt 以上，图表标签保持 11pt，不会为了塞下内容而整体缩放。",
                  },
                },
                {
                  id: "growth-delta",
                  type: "stat",
                  props: {
                    label: "同比增长",
                    value: "+18.6%",
                    description: "+4.2pp",
                  },
                },
              ],
              { textFit: { mode: "readable", minBodyPt: 11 } },
            ),
            {
              id: "margin-line",
              type: "line-chart",
              props: {
                showLegend: true,
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
          { ratio: "primary-second" },
        ),
      ]),
    };
}
