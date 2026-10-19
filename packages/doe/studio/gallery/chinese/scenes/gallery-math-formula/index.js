import { slide as __doeFn_slide } from "../../../../../runtimes/work-editor/component-gallery/slide/index.js";
import { container as __doeFn_container } from "../../../../../runtimes/work-editor/component-gallery/container/index.js";

export function createScene() {
  return {
      id: "gallery-math-formula",
      name: "组件展厅 · 数学公式",
      schema: (0, __doeFn_slide)("gallery-math-formula", [
        {
          id: "gallery-math-heading",
          type: "heading",
          props: {
            text: "方差公式 · 公式与解读并置",
            level: 2,
            kicker: "math-formula",
          },
        },
        (0, __doeFn_container)(
          "gallery-math-row",
          "row",
          [
            {
              id: "gallery-math-formula-block",
              type: "math-formula",
              props: {
                content: {
                  formula:
                    "\\sigma^2 = \\frac{1}{n}\\sum_{i=1}^{n}\\left(x_i - \\bar{x}\\right)^2",
                  display: true,
                },
              },
            },
            (0, __doeFn_container)(
              "gallery-math-takeaway",
              "stack",
              [
                {
                  id: "gallery-math-takeaway-title",
                  type: "text",
                  props: {
                    text: "方差越小，数据越集中",
                  },
                },
                {
                  id: "gallery-math-takeaway-body",
                  type: "text",
                  props: {
                    text: "方差衡量一组数据与其均值的偏离程度，为每个观测值与均值之差的平方和除以样本量。",
                  },
                },
              ],
              { gap: "12pt" },
            ),
          ],
          { ratio: "primary-first", gap: "18pt" },
        ),
      ]),
    };
}
