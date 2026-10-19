import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";
import { container as __doeFn_container } from "../../../../../runtimes/work-editor/component-gallery/container/index.js";
import { scope as __doeScope } from "../../runtime/context/index.js";

export function createScene() {
  return {
      id: "nested-text-stat-chart",
      name: "文字↓指标 + 图表",
      schema: (0, __doeFn_slide)("nested-text-stat-chart", [
        (0, __doeFn_container)(
          "insight-row",
          "row",
          [
            (0, __doeFn_container)("narrative-stack", "stack", [__doeScope.growthText, __doeScope.growthStat], {
              gap: "18pt",
            }),
            __doeScope.growthBars,
          ],
          { ratio: "primary-second" },
        ),
      ]),
    };
}
