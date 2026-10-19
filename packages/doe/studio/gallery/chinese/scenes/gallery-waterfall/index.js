import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";

export function createScene() {
  return {
      id: "gallery-waterfall",
      name: "组件展厅 6/8 · 瀑布图",
      schema: (0, __doeFn_slide)("gallery-waterfall", [
        {
          id: "gallery-waterfall-chart",
          type: "waterfall-chart",
          props: {
            subtitle: "From opening value to closing value",
            content: {
              valuePrefix: "$",
              showChangeSigns: true,
              items: [
                { label: "Opening", type: "total", value: 120 },
                { label: "Operations", value: 38 },
                { label: "Capex", value: -25 },
                { label: "Tax", value: -12 },
                { label: "FX", value: 8 },
                { label: "Closing", type: "total", value: 129 },
              ],
              callouts: [
                {
                  index: 1,
                  position: "above",
                  text: "Operations remained the largest positive contributor",
                },
              ],
              comparisons: [{ from: 1, to: 3, label: "+12%" }],
              footnote: "All values shown in USD millions",
            },
          },
        },
      ]),
    };
}
