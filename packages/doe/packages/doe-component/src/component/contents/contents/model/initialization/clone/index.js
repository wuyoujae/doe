// Origin: public/yrkie-doe/core/contents-model.js:21
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.clone = (value) => JSON.parse(JSON.stringify(value));
}
