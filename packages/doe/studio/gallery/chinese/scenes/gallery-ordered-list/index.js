import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";

export function createScene() {
  return {
      id: "gallery-ordered-list",
      name: "组件展厅 · 有序列表",
      schema: (0, __doeFn_slide)("gallery-ordered-list", [
        { id: "ordered-list-title", type: "heading", props: { text: "有序列表", level: 2 } },
        { id: "ordered-list-example", type: "ordered-list", props: { items: ["明确目标和预期结果", "整理资料，确认关键约束", "执行方案并检查结果"] } },
      ]),
    };
}
