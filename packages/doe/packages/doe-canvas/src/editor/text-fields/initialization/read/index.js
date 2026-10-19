// Origin: public/yrkie-doe/layout-engine/text-fields.js:5
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.read = (props, path) => (0, __doeScope.pathOf)(path).reduce((value, key) => value?.[key], props);
}
