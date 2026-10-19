import { createDefinition } from '../../../../component/base/ordered-list/definition/index.js';
// Origin: public/yrkie-doe/layout-engine/components.js:1232
import { scope as __doeScope } from "../../../runtime/base/context/index.js";

export function initialize() {
__doeScope.engine.registerComponent("ordered-list", createDefinition());
}
