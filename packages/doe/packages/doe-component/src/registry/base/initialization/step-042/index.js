import { createDefinition } from '../../../../component/base/text/definition/index.js';
// Origin: public/yrkie-doe/layout-engine/components.js:955
import { scope as __doeScope } from "../../../runtime/base/context/index.js";

export function initialize() {
__doeScope.engine.registerComponent("text", createDefinition());
}
