// Origin: public/yrkie-doe/layout-engine/layout-engine.js:1253
import { scope as __doeScope } from "../../runtime/context/index.js";

export function normalizeSlideBackground(input, preset, warnings) {
    if (!input || typeof input !== "object" || input.enabled === false) {
      return null;
    }
    if (preset?.allowsBleed) {
      warnings.push(
        "贴边布局不叠加 Slide 页面背景；已忽略 background，避免与贴边媒体产生双重裁切。",
      );
      return null;
    }

    const src = String(input.src || input.image?.src || "").trim();
    if (!src) {
      warnings.push("slide.background 缺少 src，已忽略页面背景。");
      return null;
    }
    const overlayInput =
      input.overlay && typeof input.overlay === "object" ? input.overlay : {};
    const requestedOpacity =
      input.overlay === false ? 0 : Number(overlayInput.opacity ?? 0);
    const opacity =
      Number.isFinite(requestedOpacity) &&
      requestedOpacity >= 0 &&
      requestedOpacity <= 0.9
        ? requestedOpacity
        : 0;
    const direction = Object.prototype.hasOwnProperty.call(
      __doeScope.SLIDE_BACKGROUND_DIRECTIONS,
      overlayInput.direction,
    )
      ? overlayInput.direction
      : "to-right";
    const foreground = ["auto", "light", "dark"].includes(input.foreground)
      ? input.foreground
      : "auto";

    return {
      src,
      fit: input.fit === "cover" ? "cover" : "contain",
      position:
        typeof input.position === "string" && input.position.trim()
          ? input.position.trim()
          : "50% 50%",
      foreground,
      contentAlign: ["left", "center", "right"].includes(input.contentAlign) ? input.contentAlign : "center",
      contentVerticalAlign: ["top", "center", "bottom"].includes(input.contentVerticalAlign) ? input.contentVerticalAlign : "center",
      ...(typeof input.contentWidth === "number" && Number.isFinite(input.contentWidth) && input.contentWidth >= 0.2 && input.contentWidth <= 1
        ? { contentWidth: input.contentWidth } : {}),
      ...(["auto", "none"].includes(input.textSurface) ? { textSurface: input.textSurface } : {}),
      overlay: {
        opacity: Math.round(opacity * 100) / 100,
        direction,
      },
    };
  }
