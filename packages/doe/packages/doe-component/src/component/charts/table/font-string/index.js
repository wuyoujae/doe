// Origin: public/yrkie-doe/components/data-table/data-table.js:295
import { scope as __doeScope } from "../runtime/context/index.js";

export function fontString(element) {
    const style = getComputedStyle(element);
    const normalFontPx =
      __doeScope.global.PPTTheme.theme.typography.styles.normal.sizes.default * (4 / 3);
    return [
      style.fontStyle || "normal",
      style.fontWeight || "300",
      style.fontSize || `${normalFontPx}px`,
      style.fontFamily || "sans-serif",
    ].join(" ");
  }
