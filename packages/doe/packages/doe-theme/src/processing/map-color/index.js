import { normalizeHex as __doeFn_normalizeHex } from "../normalize-hex/index.js";
// Origin: public/yrkie-doe/core/theme.js:245
import { scope as __doeScope } from "../../runtime/context/index.js";

export function mapColor(value, theme = __doeScope.YRKIE_THEME, context) {
    const normalized = (0, __doeFn_normalizeHex)(value);
    if (normalized === "#ffffff") {
      return context === "background" ? theme.colors.surface : theme.colors.onPrimary;
    }
    const themePath = Object.entries(__doeScope.YRKIE_THEME.colors).find(([, color]) => typeof color === 'string' && color.toLowerCase() === normalized)?.[0];
    if (themePath) return theme.colors[themePath];
    const chartIndex = __doeScope.YRKIE_THEME.colors.chart.findIndex(color => color.toLowerCase() === normalized);
    if (chartIndex >= 0) return theme.colors.chart[chartIndex];
    const path = __doeScope.LEGACY_COLOR_TO_PATH[normalized];
    return path ? path.split(".").reduce((value, key) => value?.[key], theme.colors) : undefined;
  }
