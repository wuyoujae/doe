// Origin: public/yrkie-doe/layout-engine/layout-engine.js:343
import { scope as __doeScope } from "../../runtime/context/index.js";

export function typographyCompressionSizes(styleId, sizeMode = "default") {
    const modes = ["expanded", "default", "compact"];
    const bodyStyles = ["large", "normal", "small"];
    const styles = bodyStyles.includes(styleId)
      ? bodyStyles.slice(bodyStyles.indexOf(styleId))
      : [styleId];
    const values = styles.flatMap((style, index) =>
      (index ? modes : modes.slice(modes.indexOf(sizeMode)))
        .map(mode => __doeScope.TYPOGRAPHY_STYLES[style].sizes[mode]),
    );
    return values.filter((value, index) =>
      index === 0 || value < Math.min(...values.slice(0, index)),
    );
  }
