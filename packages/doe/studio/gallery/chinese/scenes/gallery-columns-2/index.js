import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";
import { columnsGroup as __doeFn_columnsGroup } from "../../../../../runtimes/work-editor/component-gallery/columns-group/index.js";

export function createScene() {
  return {
      id: "gallery-columns-2", name: "组件展厅 · 二列布局",
      schema: (0, __doeFn_slide)("gallery-columns-2", [
        { id: "columns-2-heading", type: "heading", props: { text: "业务增长与行动计划", level: 2 } },
        (0, __doeFn_columnsGroup)("columns-2", 2, [
          [
            { id: "columns-2-summary", type: "text", props: { text: "增长来自核心业务与新市场的共同推进。先明确目标，再跟踪执行结果。" } },
            { id: "columns-2-tasks", type: "todo-list", props: { itemLayout: "stack", items: [{ text: "明确年度目标", checked: true }, { text: "完成市场验证", checked: false }, { text: "推进规模化交付", checked: false }] } },
          ],
          [{ id: "columns-2-chart", type: "grouped-bar-chart", props: { content: { categories: ["2023", "2024", "2025"], series: [{ name: "Core", data: [248, 309, 371] }, { name: "Growth", data: [162, 170, 240] }], valueSuffix: "M" } } }],
        ]),
        { id: "columns-2-notice", type: "notice", props: { text: "每列保留独立内容和编辑操作，空间不足时整列换行。" } },
      ]),
    };
}
