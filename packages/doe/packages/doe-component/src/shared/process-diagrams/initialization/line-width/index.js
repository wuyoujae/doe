// Origin: public/yrkie-doe/components/process-diagrams/process-diagrams.js:1585
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.lineWidth = (value, style = "h4") => Math.max(0, ...(0, __doeScope.manualLines)(value).map(line =>
    __doeScope.utils.measureText(line, `${__doeScope.THEME_TYPOGRAPHY.weights[__doeScope.THEME_TYPOGRAPHY.styles[style].defaultWeight]} ${(0, __doeScope.defaultFont)(style)}px ${__doeScope.FONT_STACK}`)));
}
