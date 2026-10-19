// Origin: public/yrkie-doe/components/dashboard-widgets/dashboard-widgets.js:41
import { scope as __doeScope } from "../runtime/context/index.js";

export function headerHeight(config, width) {
    const available = Math.max(180, width - 24);
    const titleLines = config.title
      ? Math.max(1, Math.ceil(__doeScope.utils.measureText(config.title, `${__doeScope.SEMIBOLD_WEIGHT} 26px ${__doeScope.FONT_STACK}`) / available))
      : 0;
    const subtitleLines = config.subtitle
      ? Math.max(1, Math.ceil(__doeScope.utils.measureText(config.subtitle, `18px ${__doeScope.FONT_STACK}`) / available))
      : 0;
    return titleLines * 30 + subtitleLines * 23 + (titleLines ? 7 : 0) + (subtitleLines ? 7 : 0);
  }
