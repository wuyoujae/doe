// Origin: public/yrkie-doe/layout-engine/components.js:8
import { scope as __doeScope } from "../../../runtime/base/context/index.js";

export function initialize() {
__doeScope.typographyMinimum = (styleId) =>
    Number(__doeScope.TYPOGRAPHY_STYLES[styleId]?.sizes?.compact);
}
