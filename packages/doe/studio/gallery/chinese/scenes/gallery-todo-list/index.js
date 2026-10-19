import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";

export function createScene() {
  return {
      id: "gallery-todo-list",
      name: "组件展厅 · 待办列表",
      schema: (0, __doeFn_slide)("gallery-todo-list", [
        { id: "todo-list-title", type: "heading", props: { text: "待办列表", level: 2 } },
        { id: "todo-list-example", type: "todo-list", props: { items: [
          { text: "明确目标和预期结果", checked: true },
          { text: "整理资料，确认关键约束", checked: false },
          { text: "执行方案并检查结果", checked: false },
        ] } },
      ]),
    };
}
