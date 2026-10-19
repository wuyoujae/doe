// Origin: public/yrkie-doe/components/waterfall-chart/waterfall-chart.js:18
import { scope as __doeScope } from "../runtime/context/index.js";

export function contrastTextColor(color) {
    const match = String(color || "").trim().match(/^#([0-9a-f]{6})$/i);
    if (!match) return __doeScope.ON_PRIMARY_COLOR;
    const channels = [0, 2, 4].map((index) =>
      Number.parseInt(match[1].slice(index, index + 2), 16) / 255
    );
    const luminance = channels
      .map((channel) =>
        channel <= 0.03928
          ? channel / 12.92
          : ((channel + 0.055) / 1.055) ** 2.4
      )
      .reduce(
        (sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index],
        0
      );
    return luminance > 0.48 ? __doeScope.BODY_COLOR : __doeScope.ON_PRIMARY_COLOR;
  }
