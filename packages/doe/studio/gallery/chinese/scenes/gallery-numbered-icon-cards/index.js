import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";

export function createScene() {
  return {
      id: "gallery-numbered-icon-cards",
      name: "组件展厅 13/13 · 编号图标阶段卡片",
      schema: (0, __doeFn_slide)("gallery-numbered-icon-cards", [
        {
          id: "gallery-numbered-icon-card-group",
          type: "numbered-icon-cards",
          props: {
            itemLayout: "grid",
            itemColumns: 2,
            content: {
              items: [
                {
                  title: "调研分析",
                  icon: "chart-no-axes-column-increasing",
                  text: "深入了解目标市场和用户需求，识别竞争格局与产品差异化机会。",
                },
                {
                  title: "设计规划",
                  icon: "compass",
                  text: "基于研究结论制定产品方案，明确内容、节奏、资源与预算安排。",
                },
                {
                  title: "开发测试",
                  icon: "code-xml",
                  text: "完成软件开发、系统集成与验证测试，确保成果符合预期。",
                },
                {
                  title: "产品推广",
                  icon: "target",
                  text: "明确市场定位和渠道策略，持续跟踪推广效果并优化方案。",
                },
              ],
            },
          },
        },
      ]),
    };
}
