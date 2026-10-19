// Origin: public/yrkie-doe/layout-engine/library-components.js:16
import { scope as __doeScope } from "../../../runtime/library/context/index.js";

export function initialize() {
__doeScope.typographyMinimum = (styleId) =>
    Number(__doeScope.TYPOGRAPHY_STYLES[styleId]?.sizes?.compact);
}
