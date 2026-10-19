import { freezeRecord as __doeFn_freezeRecord } from "../../freeze-record/index.js";
// Origin: public/yrkie-doe/core/theme.js:31; data moved without changing any values.
import { scope as __doeScope } from "../../../runtime/context/index.js";
import { themeDefinitions } from "../../../registry/index.js";

export function initialize() {
  __doeScope.YRKIE_THEME = (0, __doeFn_freezeRecord)(themeDefinitions[__doeScope.THEME_ID]);
}
