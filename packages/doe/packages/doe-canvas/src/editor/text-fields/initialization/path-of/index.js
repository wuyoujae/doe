// Origin: public/yrkie-doe/layout-engine/text-fields.js:4
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.pathOf = (path) => Array.isArray(path) ? path : path.split(".");
}
