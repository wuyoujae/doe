import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";

export function createScene() {
  return {
      id: "gallery-capability-cards",
      name: "组件展厅 12/13 · 能力卡片组",
      schema: (0, __doeFn_slide)("gallery-capability-cards", [
        {
          id: "gallery-capability-card-group",
          type: "capability-cards",
          props: {
            itemLayout: "auto",
            content: {
              items: [
                { title: "统筹管理", icon: "link", text: "统筹多供应商协作，并统一端到端计划。" },
                { title: "仓储运营", icon: "warehouse", text: "优化库存周转，并承接退换与逆向物流。" },
                { title: "运输履约", icon: "truck", text: "协同多式联运，持续跟踪履约路径。" },
                { title: "门店协同", icon: "store", text: "根据门店需求自动补货，连接本地支持资源。" },
              ],
            },
          },
        },
      ]),
    };
}
