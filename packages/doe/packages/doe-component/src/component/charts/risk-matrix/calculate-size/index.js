// Origin: public/yrkie-doe/components/risk-matrix/risk-matrix.js:17
import { scope as __doeScope } from "../runtime/context/index.js";

export function calculateSize(config) {
    const itemCount = config.content.items.length;
    const plotSize = __doeScope.utils.clamp(390 + itemCount * 4, 410, 460);
    const titleWidth = __doeScope.utils.measureText(config.title, `${__doeScope.SEMIBOLD_WEIGHT} 26.667px ${__doeScope.FONT_STACK}`);
    const subtitleWidth = __doeScope.utils.measureText(
      config.subtitle,
      `italic ${__doeScope.SEMIBOLD_WEIGHT} 24px ${__doeScope.FONT_STACK}`
    );
    const autoWidth = Math.ceil(
      Math.max(plotSize + 88, titleWidth + 36, subtitleWidth + 36)
    );
    const headerHeight = (config.title ? 38 : 0) + (config.subtitle ? 36 : 0);
    const autoHeight = headerHeight + plotSize + 72;

    return {
      width: Number(config.size?.width) || autoWidth,
      height: Number(config.size?.height) || autoHeight,
      headerHeight,
    };
  }
