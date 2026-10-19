import { slide as __doeFn_slide } from '../../slide/index.js';
import { row as __doeFn_row } from '../../row/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:122
import { scope as __doeScope } from "../../../../../integrations/work/editor/runtime/context/index.js";

export function initialize() {
__doeScope.DEFAULT_DECK = {
    version: 4,
    pageNumber: { enabled: true, format: "number" },
    deck: {
      title: "Yrkie 幻灯片",
      theme: "yrkie-theme",
      slides: [
        (0, __doeFn_slide)("yrkie-intro", [
          {
            id: "intro-heading",
            type: "heading",
            props: {
              text: "把复杂信息，变成一眼就懂的幻灯片",
              level: 1,
              kicker: "YRKIE SLIDES",
              divider: true,
            },
          },
          (0, __doeFn_row)("intro-content", [
            {
              id: "intro-copy",
              type: "text",
              props: {
                text: "使用组件化 Schema 描述内容关系，自动处理间距、换行、组合与安全区。拖动组件即可调整阅读顺序或形成新的组合。",
              },
            },
            {
              id: "intro-stat",
              type: "stat",
              props: {
                value: "16:9",
                label: "960pt × 540pt",
                description: "HTML 与 PPT 保持同一套布局语义",
              },
            },
          ], "primary-first"),
        ]),
        (0, __doeFn_slide)("yrkie-metrics", [
          {
            id: "metrics-heading",
            type: "heading",
            props: { text: "经营数据一页讲清", level: 1, divider: true },
          },
          (0, __doeFn_row)("metrics-row", [
            {
              id: "metrics-chart",
              type: "grouped-bar-chart",
              props: {
                showLegend: true,
                content: {
                  valueSuffix: "亿",
                  categories: ["Q1", "Q2", "Q3", "Q4"],
                  series: [
                    { name: "核心业务", data: [42, 48, 55, 63] },
                    { name: "增长业务", data: [22, 28, 36, 44] },
                  ],
                },
              },
            },
            {
              id: "metrics-list",
              type: "list",
              props: {
                title: "本期要点",
                items: [
                  "核心业务保持稳定增长",
                  "增长业务贡献持续提升",
                  "自动排版保留可读字号",
                ],
              },
            },
          ], "primary-first"),
        ]),
        (0, __doeFn_slide)("yrkie-process", [
          {
            id: "process-heading",
            type: "heading",
            props: { text: "从内容到交付的完整链路", level: 1, divider: true },
          },
        ]),
        (0, __doeFn_slide)("yrkie-media", [
          {
            id: "media-heading",
            type: "heading",
            props: { text: "图片与内容，自适应排版", level: 1, divider: true },
          },
          (0, __doeFn_row)("media-content", [
            {
              id: "media-points",
              type: "list",
              props: {
                title: "图片组件测试",
                items: [
                  "自动识别图片格式与原始比例",
                  "选中图片后可调整填充方式与视觉焦点",
                  "图片与文字保持独立组件，可继续拖拽重组",
                ],
              },
            },
            {
              id: "media-image",
              type: "media",
              props: {
                src: "/launch-material-slides.webp",
                alt: "Yrkie 幻灯片模板库预览",
              },
            },
          ], "primary-second"),
        ]),
      ],
    },
  };
}
