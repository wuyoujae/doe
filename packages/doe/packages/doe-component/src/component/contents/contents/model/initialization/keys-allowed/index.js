// Origin: public/yrkie-doe/core/contents-model.js:23
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.keysAllowed = (value, keys) => Object.keys(value).every(key => keys.includes(key));
}
