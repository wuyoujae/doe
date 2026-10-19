import { themeDefinitions } from '../../../registry/index.js';
import { themeFor as __doeFn_themeFor } from "../../theme-for/index.js";
import { normalizeThemeId as __doeFn_normalizeThemeId } from "../../normalize-theme-id/index.js";
import { color as __doeFn_color } from "../../color/index.js";
import { chartColor as __doeFn_chartColor } from "../../chart-color/index.js";
import { mapColor as __doeFn_mapColor } from "../../map-color/index.js";
import { cssVariables as __doeFn_cssVariables } from "../../css-variables/index.js";
import { installVariables as __doeFn_installVariables } from "../../install-variables/index.js";
import { apply as __doeFn_apply } from "../../apply/index.js";
// Origin: public/yrkie-doe/core/theme.js:303
import { scope as __doeScope } from "../../../runtime/context/index.js";

export function initialize() {
__doeScope.global.PPTTheme = Object.freeze({
    defaultThemeId: __doeScope.THEME_ID,
    themes: themeDefinitions,
    theme: __doeScope.YRKIE_THEME,
    themeFor: __doeFn_themeFor,
    normalizeThemeId: __doeFn_normalizeThemeId,
    color: __doeFn_color,
    chartColor: __doeFn_chartColor,
    mapColor: __doeFn_mapColor,
    cssVariables: __doeFn_cssVariables,
    installVariables: __doeFn_installVariables,
    apply: __doeFn_apply,
  });
}
