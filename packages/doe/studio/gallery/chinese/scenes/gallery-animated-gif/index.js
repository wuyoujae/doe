import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";
import { container as __doeFn_container } from "../../../../../runtimes/work-editor/component-gallery/container/index.js";
import { scope as __doeScope } from "../../runtime/context/index.js";

export function createScene() {
  return {
      id: "gallery-animated-gif",
      name: "组件展厅 · GIF 动图",
      schema: (0, __doeFn_slide)("gallery-animated-gif", [
        {
          id: "gallery-animated-gif-heading",
          type: "heading",
          props: {
            text: "GIF 动图 · 原生媒体播放",
            level: 1,
            kicker: "media / gif",
          },
        },
        (0, __doeFn_container)(
          "gallery-animated-gif-row",
          "row",
          [
            {
              id: "gallery-animated-gif-media",
              type: "media",
              props: {
                src: __doeScope.animatedGifDemo,
                alt: "红色、深蓝与浅红三种状态循环切换的 GIF 动图",
                title: "GIF 在 HTML 与 Studio 中保持动画",
                format: "gif",
              },
            },
            (0, __doeFn_container)(
              "gallery-animated-gif-copy",
              "stack",
              [
                {
                  id: "gallery-animated-gif-title",
                  type: "text",
                  props: {
                    text: "仍然使用 media 组件",
                  },
                },
                {
                  id: "gallery-animated-gif-body",
                  type: "text",
                  props: {
                    text: "普通 .gif 与 data:image/gif 会被自动识别；无扩展名的动态图地址可显式设置 format 为 gif。填充、裁切与焦点位置继续沿用图片组件的同一套规则。",
                  },
                },
              ],
              { gap: "18pt" },
            ),
          ],
          { ratio: "primary-first", gap: "24pt" },
        ),
      ]),
    };
}
