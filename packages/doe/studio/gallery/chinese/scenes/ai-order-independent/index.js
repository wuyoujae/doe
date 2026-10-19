import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";
import { autoContainer as __doeFn_autoContainer } from "../../../../../runtimes/work-editor/component-gallery/auto-container/index.js";
import { scope as __doeScope } from "../../runtime/context/index.js";

export function createScene() {
  return {
      id: "ai-order-independent",
      name: "AI 乱序自动重组",
      schema: (0, __doeFn_slide)("ai-order-independent", [
        // Deliberately authored in the least helpful order. The compiler uses
        // capability contracts and produces text↓metric + chart.
        (0, __doeFn_autoContainer)(
          "ai-insight-bundle",
          [__doeScope.growthBars, __doeScope.growthStat, __doeScope.growthText],
          "explain-metric-with-evidence",
        ),
      ]),
    };
}
