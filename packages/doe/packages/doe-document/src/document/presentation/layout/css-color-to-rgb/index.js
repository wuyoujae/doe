// Origin: public/yrkie-doe/layout-engine/layout-engine.js:6619
import { scope as __doeScope } from "../../runtime/context/index.js";

export function cssColorToRgb(value) {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return [20, 36, 59];
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = __doeScope.global.PPTTheme.color("mask");
    try {
      context.fillStyle = String(value || __doeScope.global.PPTTheme.color("mask"));
    } catch (_error) {
      context.fillStyle = __doeScope.global.PPTTheme.color("mask");
    }
    context.fillRect(0, 0, 1, 1);
    return [...context.getImageData(0, 0, 1, 1).data.slice(0, 3)];
  }
