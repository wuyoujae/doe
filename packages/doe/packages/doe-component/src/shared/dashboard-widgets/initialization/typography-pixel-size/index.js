// Origin: public/yrkie-doe/components/dashboard-widgets/dashboard-widgets.js:18
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.typographyPixelSize = (styleId) =>
    __doeScope.global.PPTTheme.theme.typography.styles[styleId].sizes.default * (4 / 3);
}
