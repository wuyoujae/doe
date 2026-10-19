import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";
import { columnsGroup as __doeFn_columnsGroup } from "../../../../../runtimes/work-editor/component-gallery/columns-group/index.js";

export function createScene() {
  return {
      id: "gallery-columns-4", name: "组件展厅 · 四列布局",
      schema: (0, __doeFn_slide)("gallery-columns-4", [
        { id: "columns-4-heading", type: "heading", props: { text: "四个阶段，持续推进", level: 2 } },
        (0, __doeFn_columnsGroup)("columns-4", 4, [
          [{ id: "columns-4-title-1", type: "text", props: { text: "发现" } }, { id: "columns-4-body-1", type: "text", props: { text: "收集信息，理解问题，找到值得解决的用户需求。" } }],
          [{ id: "columns-4-title-2", type: "text", props: { text: "设计" } }, { id: "columns-4-body-2", type: "text", props: { text: "梳理流程，构建方案，让关键决策有据可依。" } }],
          [{ id: "columns-4-title-3", type: "text", props: { text: "验证" } }, { id: "columns-4-body-3", type: "text", props: { text: "通过真实反馈检验方案，记录问题并持续调整。" } }],
          [{ id: "columns-4-title-4", type: "text", props: { text: "交付" } }, { id: "columns-4-body-4", type: "text", props: { text: "检查结果，完成交付，将经验用于下一轮改进。" } }],
        ]),
      ]),
    };
}
