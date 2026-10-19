// Origin: public/yrkie-doe/layout-engine/icon-fields.js:3
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.read = (props, path) => path.reduce((value, key) => value?.[key], props);
}
