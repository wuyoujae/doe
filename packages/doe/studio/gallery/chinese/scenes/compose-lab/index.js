import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";
import { scope as __doeScope } from "../../runtime/context/index.js";

export function createScene() {
  return {
      id: "compose-lab",
      name: "自由组合实验室",
      schema: (0, __doeFn_slide)("compose-lab", [__doeScope.growthText, __doeScope.growthStat, __doeScope.growthBars]),
    };
}
