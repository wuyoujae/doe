import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";

export function createScene() {
  return {
      id: "gallery-data-table",
      name: "组件展厅 · 数据表格",
      schema: (0, __doeFn_slide)("gallery-data-table", [
        {
          id: "gallery-data-table-heading",
          type: "heading",
          props: {
            text: "季度经营数据",
            level: 1,
            kicker: "table",
          },
        },
        {
          id: "gallery-data-table-component",
          type: "table",
          props: {
            ariaLabel: "2024Q4 至 2025Q4 经营数据",
            showLines: true,
            content: {
              columns: [
                { header: "季度" },
                { header: "营业收入", align: "right" },
                { header: "服务收入", align: "right" },
                { header: "EBITDA", align: "right" },
                { header: "股东应占盈利", align: "right" },
              ],
              rows: [
                { cells: ["2024Q4", "994.66亿元", "871.90亿元", "190.28亿元", "15.83亿元"] },
                { cells: ["2025Q1", "1033.54亿元", "908.81亿元", "260.61亿元", "59.29亿元"] },
                { cells: ["2025Q2", "968.48亿元", "874.75亿元", "281.76亿元", "85.55亿元"] },
                { cells: ["2025Q3", "927.83亿元", "832.81亿元", "254.01亿元", "55.16亿元"] },
                {
                  cells: [
                    { text: "2025Q4", bold: true, emphasis: "muted" },
                    { text: "992.38亿元", bold: true, emphasis: "muted" },
                    { text: "861.01亿元", bold: true, emphasis: "muted" },
                    { text: "197.83亿元", bold: true, emphasis: "muted" },
                    { text: "8.16亿元", bold: true, emphasis: "highlight" },
                  ],
                },
              ],
            },
          },
        },
      ]),
    };
}
