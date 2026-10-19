import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";
import { container as __doeFn_container } from "../../../../../runtimes/work-editor/component-gallery/container/index.js";
import { scope as __doeScope } from "../../runtime/context/index.js";

export function createScene() {
  return {
      id: "ai-deep-nesting",
      name: "AI 过深嵌套退出",
      schema: (0, __doeFn_slide)("ai-deep-nesting", [
        (0, __doeFn_container)(
          "depth-1",
          "stack",
          [
            (0, __doeFn_container)(
              "depth-2",
              "row",
              [
                (0, __doeFn_container)(
                  "depth-3",
                  "stack",
                  [
                    (0, __doeFn_container)("depth-4", "row", [__doeScope.growthText, __doeScope.growthStat], {
                      keepGroup: true,
                    }),
                    __doeScope.growthBars,
                  ],
                  { keepGroup: true },
                ),
                {
                  id: "depth-2-note",
                  type: "stat",
                  props: { label: "第二层", value: "02", description: "结构保留" },
                },
              ],
              { keepGroup: true },
            ),
            {
              id: "depth-1-note",
              type: "stat",
              props: { label: "第一层", value: "01", description: "自动检查" },
            },
          ],
          { keepGroup: true },
        ),
      ]),
    };
}
