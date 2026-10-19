import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";
import { container as __doeFn_container } from "../../../../../runtimes/work-editor/component-gallery/container/index.js";

export function createScene() {
  return {
      id: "gallery-structured-content",
      name: "组件展厅 2/8 · 结构内容",
      schema: (0, __doeFn_slide)("gallery-structured-content", [
        (0, __doeFn_container)(
          "gallery-question-row",
          "row",
          [
            {
              id: "gallery-question-one",
              type: "question-card",
              props: {
                index: "判断",
                title: "信息是否足够清晰？",
                text: "顶部标记可以由 AI 自定义；问题卡仍可换序、成组或自动转成两列。",
              },
            },
            {
              id: "gallery-question-two",
              type: "question-card",
              props: {
                title: "证据是否支持结论？",
                text: "省略 index 后，系统按照当前阅读顺序自动编号。",
              },
            },
          ],
          { ratio: "balanced", gap: "12pt" },
        ),
        (0, __doeFn_container)(
          "gallery-structure-row",
          "row",
          [
            {
              id: "gallery-list",
              type: "list",
              props: {
                title: "无序列表 · list",
                itemLayout: "stack",
                items: [
                  "统一的内容节点模型",
                  "可拖拽的阅读顺序",
                  "11pt 正文安全底线",
                  "无法排下时自动分包",
                ],
              },
            },
          ],
          { ratio: "primary-second", gap: "18pt" },
        ),
      ]),
    };
}
