import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";
import { autoContainer as __doeFn_autoContainer } from "../../../../../runtimes/work-editor/component-gallery/auto-container/index.js";

export function createScene() {
  return {
      id: "ai-overcomposed",
      name: "AI 超容量自动分包",
      schema: (0, __doeFn_slide)("ai-overcomposed", [
        (0, __doeFn_autoContainer)(
          "ai-overfull-group",
          [
            {
              id: "duplicate-ai-item",
              type: "stat",
              props: { value: "18.6%", label: "收入增长", description: "全年同比" },
            },
            {
              id: "duplicate-ai-item",
              type: "stat",
              props: { value: "92%", label: "续约率", description: "核心客户" },
            },
            {
              id: "ai-margin-stat",
              type: "stat",
              props: { value: "31%", label: "毛利率", description: "提升 3.2pp" },
            },
            {
              id: "ai-cash-stat",
              type: "stat",
              props: { value: "8.4亿", label: "经营现金流", description: "创历史新高" },
            },
            {
              id: "ai-context-copy",
              type: "text",
              props: {
                title: "规模与质量同步改善",
                text: "AI 可以一次给出超容量内容；编译器会按语义把指标恢复成可换行集合，并把说明文字放入独立轨道。",
              },
            },
            {
              id: "ai-next-step",
              type: "text",
              props: {
                title: "下一步",
                text: "继续扩大高价值行业覆盖，并将交付资源向高续约客户倾斜。",
              },
            },
          ],
          "compare-kpis",
        ),
      ]),
    };
}
