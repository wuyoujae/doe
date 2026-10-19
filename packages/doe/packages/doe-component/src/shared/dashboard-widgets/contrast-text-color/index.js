import { rgbChannels as __doeFn_rgbChannels } from '../rgb-channels/index.js';
// Origin: public/yrkie-doe/components/dashboard-widgets/dashboard-widgets.js:501
import { scope as __doeScope } from "../runtime/context/index.js";

export function contrastTextColor(color) {
    const channels = (0, __doeFn_rgbChannels)(color);
    if (!channels) return __doeScope.ON_PRIMARY_COLOR;
    const luminance = channels
      .map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.03928
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      })
      .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
    return luminance > 0.48 ? __doeScope.BODY_COLOR : __doeScope.ON_PRIMARY_COLOR;
  }
