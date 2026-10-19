import { slide as __doeFn_slide } from '../../slide/index.js';
// Origin: public/yrkie-doe/work-editor/component-gallery.js:1558
import { scope as __doeScope } from "../../../../../studio/gallery/chinese/runtime/context/index.js";

export function initialize() {
__doeScope.global.SlideDemoSchemas.push(...[
    ["filled", "浅底卡片"],
    ["filled-icon", "图标浅底卡片"],
    ["outline", "描边卡片"],
    ["side-rule", "侧边细条卡片"],
    ["top-rule", "顶部细条卡片"],
    ["top-icon", "顶部图标卡片"],
    ["connected", "连体卡片"],
    ["connected-icon", "图标连体卡片"],
    ["leaf", "柳叶卡片"], ["quote", "引号卡片"], ["bubble", "气泡卡片"]
  ].map(([variant, label]) => ({
    id: `gallery-item-cards-${variant}`, name: `组件展厅 · ${label}`,
    schema: (0, __doeFn_slide)(`gallery-item-cards-${variant}`, [
      { id: `items-heading-${variant}`, type: "heading", props: { text: label, level: 2 } },
      { id: `items-${variant}`, type: "item-cards", props: { variant, items: [
        { title: "明确目标", text: "了解用户需求，确认业务约束，让每一步都有清晰的方向。", icon: "Target" },
        { title: "执行计划", text: "将目标拆解为具体行动，持续检查进展，及时同步关键变化。", icon: "Layers" },
        { title: "衡量结果", text: "对照预期评估结果，记录变化并持续改进。", icon: "ChartNoAxesCombined" },
      ] } },
    ]),
  })));
}
