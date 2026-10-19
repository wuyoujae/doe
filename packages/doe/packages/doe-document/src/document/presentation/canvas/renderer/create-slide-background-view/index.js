import { element as __doeFn_element } from "../../../../../../../doe-core/src/runtime/element/index.js";
import { applySlideBackgroundView as __doeFn_applySlideBackgroundView } from "../apply-slide-background-view/index.js";
import { notify as __doeFn_notify } from "../../../../../../../doe-core/src/operation/notify/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:6876


export function createSlideBackgroundView(state) {
    const background = state.slide.background;
    if (!background) return null;
    const layer = (0, __doeFn_element)("div", "schema-slide__background");
    const image = (0, __doeFn_element)("div", "schema-slide__background-image");
    const overlay = (0, __doeFn_element)("div", "schema-slide__background-overlay");
    layer.setAttribute("aria-hidden", "true");
    layer.append(image, overlay);

    let controls = null;
    let opacityInput = null;
    let opacityOutput = null;
    if (state.slide.editor) {
      controls = (0, __doeFn_element)("div", "slide-background-controls");
      controls.setAttribute("aria-label", "Slide 页面背景控制");
      controls.addEventListener("pointerdown", (event) => event.stopPropagation());
      controls.addEventListener("click", (event) => event.stopPropagation());
      controls.append((0, __doeFn_element)("span", "slide-background-controls__label", "背景遮罩"));

      [
        ["to-right", "→", "从左向右渐隐"],
        ["to-left", "←", "从右向左渐隐"],
        ["to-bottom", "↓", "从上向下渐隐"],
        ["to-top", "↑", "从下向上渐隐"],
      ].forEach(([direction, label, title]) => {
        const button = (0, __doeFn_element)(
          "button",
          "slide-background-controls__button",
          label,
        );
        button.type = "button";
        button.title = title;
        button.dataset.backgroundDirection = direction;
        button.addEventListener("click", () => {
          if (state.slide.background.overlay.direction === direction) return;
          state.slide.background.overlay.direction = direction;
          (0, __doeFn_applySlideBackgroundView)(state);
          (0, __doeFn_notify)(state, {
            rejected: false,
            action: `页面背景遮罩改为${title}`,
          });
        });
        controls.append(button);
      });

      opacityInput = (0, __doeFn_element)("input", "slide-background-controls__range");
      opacityInput.type = "range";
      opacityInput.min = "0";
      opacityInput.max = "0.9";
      opacityInput.step = "0.02";
      opacityInput.setAttribute("aria-label", "背景遮罩透明度");
      opacityInput.addEventListener("input", () => {
        state.slide.background.overlay.opacity =
          Math.round(Number(opacityInput.value) * 100) / 100;
        (0, __doeFn_applySlideBackgroundView)(state);
      });
      opacityInput.addEventListener("change", () => {
        (0, __doeFn_notify)(state, {
          rejected: false,
          action: `页面背景遮罩透明度调整为 ${Math.round(
            state.slide.background.overlay.opacity * 100,
          )}%`,
        });
      });
      opacityOutput = (0, __doeFn_element)(
        "output",
        "slide-background-controls__output",
      );
      controls.append(opacityInput, opacityOutput);
    }

    state.backgroundView = {
      layer,
      image,
      overlay,
      controls,
      opacityInput,
      opacityOutput,
    };
    (0, __doeFn_applySlideBackgroundView)(state);
    return state.backgroundView;
  }
