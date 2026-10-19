import { installVariables as __doeFn_installVariables } from "../../install-variables/index.js";
// Origin: public/yrkie-doe/core/theme.js:301
import { scope as __doeScope } from "../../../runtime/context/index.js";

export function initialize() {
(0, __doeFn_installVariables)(__doeScope.global.document?.documentElement, __doeScope.YRKIE_THEME);
}
