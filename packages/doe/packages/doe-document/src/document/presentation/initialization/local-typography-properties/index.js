// Origin: public/yrkie-doe/layout-engine/layout-engine.js:7403
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.LOCAL_TYPOGRAPHY_PROPERTIES = Object.freeze([
    "--composition-density",
    "--composition-font-floor",
    "--body-size",
    "--component-title-size",
    "--slide-title-size",
    "--hero-title-size",
    "--hero-subtitle-size",
    "--eyebrow-size",
    "--metric-value-size",
    "--small-text-size",
    "--delta-text-size",
    "--question-index-size",
    "--metric-min-height",
    "--component-padding",
    "--component-gap",
    ...Object.keys(__doeScope.TYPOGRAPHY_STYLES).flatMap((styleId) => [
      `--typography-${styleId}-size`,
      `--typography-${styleId}-weight`,
    ]),
  ]);
}
