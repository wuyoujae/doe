import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";
import { autoContainer as __doeFn_autoContainer } from "../../../../../runtimes/work-editor/component-gallery/auto-container/index.js";

export function createScene() {
  return {
      id: "adaptive-kpi-collection",
      name: "同类指标自适应集合",
      schema: (0, __doeFn_slide)("adaptive-kpi-collection", [
        (0, __doeFn_autoContainer)(
          "kpi-collection",
          [
            {
              id: "kpi-revenue",
              type: "stat",
              props: { value: "18.6%", label: "收入增长", description: "全年同比" },
            },
            {
              id: "kpi-renewal",
              type: "stat",
              props: { value: "92%", label: "续约率", description: "核心客户" },
            },
            {
              id: "kpi-margin",
              type: "stat",
              props: { value: "31%", label: "毛利率", description: "+3.2pp" },
            },
            {
              id: "kpi-cash",
              type: "stat",
              props: { value: "8.4亿", label: "经营现金流", description: "历史新高" },
            },
            {
              id: "kpi-users",
              type: "stat",
              props: { value: "1.26亿", label: "连接用户", description: "+12%" },
            },
          ],
          "compare-kpis",
        ),
      ]),
    };
}
