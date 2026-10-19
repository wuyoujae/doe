// Origin: public/yrkie-doe/core/contents-model.js:22
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.present = (value) => value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0);
}
