import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";
import { container as __doeFn_container } from "../../../../../runtimes/work-editor/component-gallery/container/index.js";

export function createScene() {
  return {
      id: "gallery-code-block",
      name: "组件展厅 · 代码与讲解",
      schema: (0, __doeFn_slide)("gallery-code-block", [
        {
          id: "gallery-code-heading",
          type: "heading",
          props: {
            text: "代码保持字号，列宽变化时优先换行",
            level: 2,
            kicker: "code-block",
          },
        },
        (0, __doeFn_container)(
          "gallery-code-row",
          "row",
          [
            {
              id: "gallery-python-code",
              type: "code-block",
              props: {
                title: "嵌套循环示例",
                language: "python",
                code: "for i in range(1, 4):\n    for j in range(1, 4):\n        print(i, j)",
                caption: "外层每执行一次，内层完整执行三次。",
                wrap: true,
              },
            },
            (0, __doeFn_container)(
              "gallery-code-notes",
              "stack",
              [
                {
                  id: "gallery-code-title",
                  type: "text",
                  props: {
                    text: "先读外层，再读内层",
                  },
                },
                {
                  id: "gallery-code-list",
                  type: "list",
                  props: {
                    items: [
                      "i 每次确定一轮外层任务",
                      "j 在每一轮中重新从 1 遍历到 3",
                      "总执行次数为 3 × 3 = 9",
                    ],
                    itemLayout: "stack",
                    itemColumns: 1,
                  },
                },
              ],
              { gap: "12pt" },
            ),
          ],
          { ratio: "primary-first", gap: "24pt" },
        ),
      ]),
    };
}
