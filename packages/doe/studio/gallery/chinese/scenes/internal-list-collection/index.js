import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";

export function createScene() {
  return {
      id: "internal-list-collection",
      name: "列表 item 内部集合",
      schema: (0, __doeFn_slide)("internal-list-collection", [
        {
          id: "priority-actions",
          type: "list",
          props: {
            title: "六项行动自动排成两列",
            itemLayout: "auto",
            itemColumns: 2,
            items: [
              "聚焦高续约行业并提高客户覆盖密度",
              "把重点交付资源集中到高价值账户",
              "建立区域级客户成功复盘机制",
              "将产品使用信号纳入续约预测",
              "统一渠道、直销与交付的目标口径",
              "按月跟踪收入质量与现金转化",
            ],
          },
        },
      ]),
    };
}
