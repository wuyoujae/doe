import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";
import { scope as __doeScope } from "../../runtime/context/index.js";

export function createScene() {
  return {
      id: "split-right-bleed",
      name: "贴边媒体（左/右/上/下）",
      schema: (0, __doeFn_slide)(
        "split-right-bleed-demo",
        [
          {
            id: "edge-layout",
            type: "layout-group",
            layout: {
              variant: "edge-media",
              mediaPosition: "right",
              mediaRatio: 0.36,
              gap: 0,
              align: "stretch",
              origin: "explicit",
            },
            children: [
              {
                id: "content-region",
                type: "layout-group",
                layout: {
                  region: "content",
                  variant: "stack",
                  gap: "24pt",
                  align: "stretch",
                },
                children: [
                  {
                    id: "story-heading",
                    type: "hero",
                    props: {
                      eyebrow: "第二部分｜增长来自哪里？",
                      title: "连接业务仍是基本盘，增长正向物联网与行业连接延伸",
                    },
                  },
                  {
                    id: "customer-scale",
                    type: "stat",
                    props: {
                      value: ">12亿",
                      label: "连接用户总规模",
                      description: "2025年末，全年增加约1.10亿",
                    },
                  },
                  {
                    id: "iot-scale",
                    type: "stat",
                    props: {
                      value: "7.20亿",
                      label: "物联网连接数",
                      description: "行业连接保持稳定增长",
                    },
                  },
                ],
              },
              {
                id: "poster-region",
                type: "media",
                layout: {
                  region: "media",
                  slotSpace: { top: 0, right: 0, bottom: 0, left: 0 },
                },
                props: {
                  src: "./assets/smart-city-poster.png",
                  alt: "智慧城市、交通和工业设施通过网络连接的城市插画",
                  position: "50% 50%",
                },
              },
            ],
          },
        ],
        { ...__doeScope.baseLayout, preset: "edge-media" },
      ),
    };
}
