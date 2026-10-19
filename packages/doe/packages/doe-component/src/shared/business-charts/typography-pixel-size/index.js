// Origin: public/yrkie-doe/components/business-charts/business-charts.js:16
import { scope as __doeScope } from "../runtime/context/index.js";

export function typographyPixelSize(element, styleId) {
    const configured = __doeScope.global.getComputedStyle?.(element)
      ?.getPropertyValue(`--typography-${styleId}-size`)
      ?.trim();
    const value = Number.parseFloat(configured);
    if (Number.isFinite(value) && value > 0) {
      if (configured.endsWith("pt")) return value * (4 / 3);
      return value;
    }
    return (Number(__doeScope.THEME_TYPOGRAPHY.styles?.[styleId]?.sizes?.default) || 13.5) * (4 / 3);
  }
