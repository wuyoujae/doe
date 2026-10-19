import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";
import { container as __doeFn_container } from "../../../../../runtimes/work-editor/component-gallery/container/index.js";

export function createScene() {
  return {
      id: "gallery-kpi-media",
      name: "组件展厅 3/8 · 指标媒体",
      schema: (0, __doeFn_slide)("gallery-kpi-media", [
        (0, __doeFn_container)(
          "gallery-kpi-media-row",
          "row",
          [
            {
              id: "gallery-kpi-collection",
              type: "layout-group",
              kind: "collection",
              layout: {
                variant: "grid",
                direction: "row",
                columns: 2,
                maxColumns: 2,
                gap: "12pt",
                align: "stretch",
                origin: "explicit",
                collectionKey: "kpi",
                keepGroup: true,
                textFit: { mode: "readable", minBodyPt: 11 },
              },
              children: [
                {
                  id: "gallery-stat-revenue",
                  type: "stat",
                  props: {
                    value: "18.6%",
                    label: "收入增长",
                    description: "stat · 全年同比",
                  },
                },
                {
                  id: "gallery-stat-cash",
                  type: "stat",
                  props: {
                    value: "8.4亿",
                    label: "经营现金流",
                    description: "stat · 历史新高",
                  },
                },
              ],
            },
            {
              id: "gallery-media",
              type: "media",
              props: {
                src: "./assets/smart-city-poster.png",
                alt: "智慧城市、交通与产业设施相互连接的海报插画",
                position: "50% 50%",
                aspectRatio: 0.64,
              },
            },
          ],
          { ratio: "primary-first", gap: "18pt" },
        ),
      ]),
    };
}
