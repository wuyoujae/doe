import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";
import { columnsGroup as __doeFn_columnsGroup } from "../../../../../runtimes/work-editor/component-gallery/columns-group/index.js";

export function createScene() {
  return {
      id: "gallery-columns-3", name: "组件展厅 · 三列布局",
      schema: (0, __doeFn_slide)("gallery-columns-3", [
        { id: "columns-3-heading", type: "heading", props: { text: "从目标到结果", level: 2 } },
        (0, __doeFn_columnsGroup)("columns-3", 3, [
          [{ id: "columns-3-title-1", type: "text", props: { text: "明确目标" } }, { id: "columns-3-list", type: "ordered-list", props: { itemLayout: "stack", items: ["了解用户需求", "确认业务约束", "制定验证计划"] } }],
          [{ id: "columns-3-title-2", type: "text", props: { text: "执行计划" } }, { id: "columns-3-todo", type: "todo-list", props: { itemLayout: "stack", items: [{ text: "完成方案设计", checked: true }, { text: "检查交付质量", checked: false }] } }, { id: "columns-3-notice", type: "notice", props: { text: "关键变更及时同步。" } }],
          [{ id: "columns-3-title-3", type: "text", props: { text: "衡量结果" } }, { id: "columns-3-body", type: "text", props: { text: "对照预期评估结果，记录变化并持续改进。" } }, { id: "columns-3-formula", type: "math-formula", props: { content: { formula: "\\bar{x}=\\frac{1}{n}\\sum_{i=1}^{n}x_i", display: true } } }],
        ]),
      ]),
    };
}
