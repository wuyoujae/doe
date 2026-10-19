import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";
import { container as __doeFn_container } from "../../../../../runtimes/work-editor/component-gallery/container/index.js";
import { scope as __doeScope } from "../../runtime/context/index.js";

export function createScene() {
  return {
      id: "gallery-slide-background",
      name: "组件展厅 8/8 · 页面背景",
      schema: (0, __doeFn_slide)(
        "gallery-slide-background",
        [
          {
            id: "background-hero",
            type: "hero",
            props: {
              eyebrow: "SLIDE BACKGROUND",
              title: "背景属于 Slide，不属于任何内容组件",
              subtitle:
                "图片覆盖整页画布；内容仍在安全区内居中排开。右上角可切换渐变方向并连续调整遮罩透明度。",
            },
          },
          (0, __doeFn_container)(
            "background-stat-row",
            "row",
            [
              {
                id: "background-stat-layout",
                type: "stat",
                props: {
                  value: "960×540pt",
                  label: "固定 16:9 画布",
                  description: "背景变化不会改变内容布局",
                },
              },
              {
                id: "background-stat-overlay",
                type: "stat",
                props: {
                  value: "58%",
                  label: "渐变遮罩透明度",
                  description: "编辑模式可实时调整 0–90%",
                },
              },
            ],
            { ratio: "balanced", gap: "24pt" },
          ),
        ],
        { ...__doeScope.baseLayout, preset: "flow" },
        {
          src: "./assets/smart-city-poster.png",
          fit: "cover",
          position: "50% 52%",
          foreground: "light",
          overlay: {
            opacity: 0.58,
            direction: "to-right",
          },
        },
      ),
    };
}
