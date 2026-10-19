import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";
import { scope as __doeScope } from "../../runtime/context/index.js";

export function createScene() {
  return {
      id: "ai-bottom-overflow",
      name: "复杂页测量修复",
      schema: (0, __doeFn_slide)(
        "ai-bottom-overflow",
        [
          {
            id: "overflow-heading",
            type: "hero",
            props: {
              eyebrow: "AI GENERATED · AUTO REPAIR",
              title: "增长质量改善，但资源配置仍需聚焦高价值场景",
            },
          },
          {
            id: "overflow-copy",
            type: "text",
            props: {
              title: "管理层摘要",
              text: "企业客户续约和产品结构共同拉动增长。系统先尝试重分配轨道、改变组合方向与回收重复间距，再允许可换行正文降到 8pt；图表标签、标题和关键数值仍保持各自的安全字体底线。",
            },
          },
          __doeScope.growthBars,
          {
            id: "overflow-actions",
            type: "list",
            props: {
              title: "后续行动",
              items: [
                "把交付资源向高续约行业倾斜",
                "在下一季度复核渠道获客效率",
                "将低毛利定制需求迁移到标准产品",
                "建立重点客户流失预警机制",
              ],
            },
          },
        ],
        {
          ...__doeScope.baseLayout,
          autoRepair: true,
          maxRepairPasses: 4,
          allowEmergency8Pt: true,
          fallback: "needs-continuation",
        },
      ),
    };
}
