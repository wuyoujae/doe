import { backgroundColorStop as __doeFn_backgroundColorStop } from "../../../layout/background-color-stop/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:6831
import { scope as __doeScope } from "../../../runtime/context/index.js";

export function applySlideBackgroundView(state) {
    const background = state.slide.background;
    const view = state.backgroundView;
    if (!background || !view) return;
    const opacity = Math.max(
      0,
      Math.min(0.9, Number(background.overlay?.opacity) || 0),
    );
    const direction =
      __doeScope.SLIDE_BACKGROUND_DIRECTIONS[background.overlay?.direction] ||
      __doeScope.SLIDE_BACKGROUND_DIRECTIONS["to-right"];
    const color = __doeScope.global.PPTTheme.color("mask");

    view.image.style.backgroundImage = `url(${JSON.stringify(background.src)})`;
    view.image.style.backgroundSize = background.fit || "cover";
    view.image.style.backgroundPosition = background.position || "50% 50%";
    view.overlay.style.backgroundImage = `linear-gradient(${direction}, ${(0, __doeFn_backgroundColorStop)(color, opacity)} 0%, ${(0, __doeFn_backgroundColorStop)(color, opacity * 0.68)} 54%, ${(0, __doeFn_backgroundColorStop)(color, 0)} 100%)`;
    state.slideElement.dataset.hasBackground = "true";
    state.layoutElement.style.justifyContent = { top: "flex-start", center: "safe center", bottom: "safe flex-end" }[background.contentVerticalAlign];
    const requestedForeground = background.foreground || "auto";
    // An image alone must not override the theme. Only a deliberate mask
    // above 20% opts automatic foreground text into the light fallback.
    state.slideElement.dataset.backgroundForeground =
      requestedForeground === "auto"
        ? opacity > 0.2 ? "light" : "dark"
        : requestedForeground;
    state.slideElement.dataset.backgroundDirection =
      background.overlay?.direction || "to-right";

    view.controls
      ?.querySelectorAll("[data-background-direction]")
      .forEach((button) => {
        button.setAttribute(
          "aria-pressed",
          String(
            button.dataset.backgroundDirection ===
              background.overlay?.direction,
          ),
        );
      });
    if (view.opacityInput) view.opacityInput.value = String(opacity);
    if (view.opacityOutput) {
      view.opacityOutput.textContent = `${Math.round(opacity * 100)}%`;
    }
  }
