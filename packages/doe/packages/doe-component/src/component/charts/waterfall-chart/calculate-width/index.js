// Origin: public/yrkie-doe/components/waterfall-chart/waterfall-chart.js:177
import { scope as __doeScope } from "../runtime/context/index.js";

export function calculateWidth(config) {
    const content = config.content;
    const titleWidth = __doeScope.utils.measureText(config.title || "", `${__doeScope.SEMIBOLD_WEIGHT} 26.667px ${__doeScope.FONT_STACK}`);
    const subtitleWidth = __doeScope.utils.measureText(config.subtitle || "", `24px ${__doeScope.FONT_STACK}`);
    const longestLabel = Math.max(
      0,
      ...content.items.map((item) =>
        __doeScope.utils.measureText(String(item.label).replace(/\n/g, " "), `16px ${__doeScope.FONT_STACK}`)
      )
    );
    const slotWidth = __doeScope.utils.clamp(longestLabel * 0.42 + 48, 70, 104);
    const autoWidth = __doeScope.utils.clamp(
      Math.ceil(
        Math.max(
          460,
          76 + content.items.length * slotWidth + 20,
          titleWidth + 24,
          subtitleWidth + 24
        )
      ),
      460,
      1840
    );
    return Number(config.size?.width) || autoWidth;
  }
