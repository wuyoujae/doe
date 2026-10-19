import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";
import { autoContainer as __doeFn_autoContainer } from "../../../../../runtimes/work-editor/component-gallery/auto-container/index.js";
import { scope as __doeScope } from "../../runtime/context/index.js";

export function createScene() {
  return {
      id: "ai-late-member-reflow",
      name: "先组合后补文字",
      schema: (0, __doeFn_slide)("ai-late-member-reflow", [
        (0, __doeFn_autoContainer)(
          "late-member-bundle",
          [
            __doeScope.growthText,
            (0, __doeFn_autoContainer)(
              "early-metric-chart-pair",
              [__doeScope.growthStat, __doeScope.growthBars],
              "early-pair-before-text",
            ),
          ],
          "replan-whole-member-set",
        ),
      ]),
    };
}
