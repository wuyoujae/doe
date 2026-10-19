import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";
import { localCluster as __doeFn_localCluster } from "../../../../../runtimes/work-editor/component-gallery/local-cluster/index.js";

export function createScene() {
  return {
      id: "nested-kpi-cluster",
      name: "指标局部嵌套（拖拽可拆）",
      schema: (0, __doeFn_slide)("nested-kpi-cluster", [
        {
          id: "nested-kpi-grid",
          type: "layout-group",
          kind: "collection",
          layout: {
            variant: "auto-grid",
            direction: "row",
            columns: "auto",
            maxColumns: 4,
            maxItems: 16,
            collectionKey: "kpi",
            gap: "18pt",
            align: "stretch",
            origin: "explicit",
            keepGroup: true,
          },
          children: [
            {
              id: "nested-revenue",
              type: "stat",
              props: { value: "18.6%", label: "收入增长", description: "全年同比" },
            },
            {
              id: "nested-renewal",
              type: "stat",
              props: { value: "92%", label: "续约率", description: "核心客户" },
            },
            {
              id: "nested-margin",
              type: "stat",
              props: { value: "31%", label: "毛利率", description: "+3.2pp" },
            },
            (0, __doeFn_localCluster)("cash-users-column", "stack", "kpi", [
              {
                id: "nested-cash",
                type: "stat",
                props: { value: "8.4亿", label: "经营现金流", description: "历史新高" },
              },
              {
                id: "nested-users",
                type: "stat",
                props: { value: "1.26亿", label: "连接用户", description: "+12%" },
              },
            ]),
          ],
        },
      ]),
    };
}
