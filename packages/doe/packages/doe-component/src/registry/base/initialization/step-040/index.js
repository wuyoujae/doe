import { createDefinition } from '../../../../component/base/stat/definition/index.js';
// Origin: public/yrkie-doe/layout-engine/components.js:526
import { scope as __doeScope } from "../../../runtime/base/context/index.js";

export function initialize() {
__doeScope.engine.registerComponent("stat", createDefinition());
}
