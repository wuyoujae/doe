import { createDefinition } from '../../../../component/contents/quote/definition/index.js';
// Origin: public/yrkie-doe/layout-engine/components.js:1276
import { scope as __doeScope } from "../../../runtime/base/context/index.js";

export function initialize() {
__doeScope.engine.registerComponent("quote", createDefinition());
}
