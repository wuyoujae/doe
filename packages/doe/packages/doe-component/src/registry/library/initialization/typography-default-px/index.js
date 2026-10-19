// Origin: public/yrkie-doe/layout-engine/library-components.js:18
import { scope as __doeScope } from "../../../runtime/library/context/index.js";

export function initialize() {
__doeScope.typographyDefaultPx = (styleId) =>
    Number(__doeScope.TYPOGRAPHY_STYLES[styleId]?.sizes?.default) * (4 / 3);
}
