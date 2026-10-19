import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";
import { container as __doeFn_container } from "../../../../../runtimes/work-editor/component-gallery/container/index.js";

export function createScene() {
  return {
      id: "gallery-content",
      name: "组件展厅 1/8 · 文字内容",
      schema: (0, __doeFn_slide)("gallery-content", [
        {
          id: "gallery-hero",
          type: "hero",
          props: {
            eyebrow: "COMPONENT SYSTEM",
            title: "一套 Schema，同时服务 HTML 与 PPT",
            subtitle: "基础内容组件会自动换行、测量高度，并始终遵守 960pt × 540pt 安全画布。",
          },
        },
        {
          id: "gallery-heading",
          type: "heading",
          props: {
            text: "文字组件可以独立存在，也可以进入任意自适应组合",
            level: 2,
            kicker: "heading",
          },
        },
        (0, __doeFn_container)(
          "gallery-content-row",
          "row",
          [
            {
              id: "gallery-text",
              type: "text",
              props: {
                title: "普通文字 · text",
                text: "正文根据列宽自动换行；空间不足时优先重排布局，再逐级压缩间距与字号，不允许重叠或静默裁切。",
              },
            },
            {
              id: "gallery-quote",
              type: "quote",
              props: {
                text: "布局不是绝对坐标，而是内容关系经过约束求解后的稳定结果。",
                source: "Adaptive Slide Engine",
              },
            },
          ],
          { ratio: "balanced" },
        ),
      ]),
    };
}
