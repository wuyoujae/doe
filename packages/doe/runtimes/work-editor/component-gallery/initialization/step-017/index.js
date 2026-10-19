import { columnsGroup as __doeFn_columnsGroup } from '../../columns-group/index.js';
// Origin: public/yrkie-doe/work-editor/component-gallery.js:1585
import { scope as __doeScope } from "../../../../../studio/gallery/chinese/runtime/context/index.js";

export function initialize() {
__doeScope.global.SlideDemoSchemas.push(
    (0, __doeScope.itemScene)("five", "内容卡片 · 五项与提示", [
      (0, __doeScope.peerHeading)("contents-five-heading", "从目标到结果"),
      { id: "contents-five-cards", type: "item-cards", props: { variant: "top-icon", items: (0, __doeScope.peerItems)(5), itemLayout: "grid", itemColumns: 3 } },
      (0, __doeScope.peerNotice)("contents-five-notice"),
    ]),
    (0, __doeScope.itemScene)("chart", "内容卡片 · 图表与正文", [
      (0, __doeScope.peerHeading)("contents-chart-heading", "业务增长与行动计划"),
      (0, __doeFn_columnsGroup)("contents-chart-columns", 2, [
        [{ id: "contents-chart-cards", type: "item-cards", props: { variant: "side-rule", items: (0, __doeScope.peerItems)(3) } }],
        [{ id: "contents-chart-visual", type: "grouped-bar-chart", props: { content: { categories: ["2023", "2024", "2025"], series: [{ name: "Core", data: [248, 309, 371] }, { name: "Growth", data: [162, 170, 240] }] } } }],
      ]),
      (0, __doeScope.peerNotice)("contents-chart-notice"),
    ]),
    (0, __doeScope.itemScene)("capabilities", "能力卡片 · 五项与引用", [
      (0, __doeScope.peerHeading)("contents-cap-heading", "执行计划"),
      { id: "contents-cap-cards", type: "capability-cards", props: { content: { items: (0, __doeScope.peerItems)(5) }, itemLayout: "grid", itemColumns: 3 } },
      { id: "contents-cap-quote", type: "quote", props: { text: "对照预期评估结果，记录变化并持续改进。", source: "Adaptive Slide Engine" } },
    ]),
    (0, __doeScope.itemScene)("icons", "图标卡片 · 五项与正文", [
      (0, __doeScope.peerHeading)("contents-icons-heading", "衡量结果"),
      { id: "contents-icons-cards", type: "numbered-icon-cards", props: { content: { items: (0, __doeScope.peerItems)(5) }, itemLayout: "grid", itemColumns: 3 } },
      { id: "contents-icons-body", type: "text", props: { text: "每列保留独立内容和编辑操作，空间不足时整列换行。" } },
    ]),
    (0, __doeScope.itemScene)("questions", "引用与问答 · 五项混排", [
      (0, __doeScope.peerHeading)("contents-questions-heading", "明确目标"),
      { id: "contents-questions-group", type: "layout-group", layout: { variant: "grid", columns: 3, keepGroup: true, gap: "18pt" }, children: (0, __doeScope.peerItems)(5).map((item, i) => ({
        id: `contents-question-${i}`, type: i % 2 ? "quote" : "question-card", props: i % 2 ? { text: item.text, source: item.title } : { title: item.title, text: item.text },
      })) },
      (0, __doeScope.peerNotice)("contents-questions-notice"),
    ]),
    (0, __doeScope.itemScene)("columns", "四列布局 · 六项与正文", [
      (0, __doeScope.peerHeading)("contents-columns-heading", "四个阶段，持续推进"),
      (0, __doeFn_columnsGroup)("contents-columns-six", 4, (0, __doeScope.peerItems)(6).map((item, i) => [
        { id: `contents-columns-text-${i}`, type: "text", props: { title: item.title, text: item.text } },
      ])),
      (0, __doeScope.peerNotice)("contents-columns-notice"),
    ]),
  );
}
