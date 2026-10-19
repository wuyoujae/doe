import { createDefinition } from '../../../../component/base/code-block/definition/index.js';
// Origin: public/yrkie-doe/layout-engine/components.js:1034
import { scope as __doeScope } from "../../../runtime/base/context/index.js";

export function initialize() {
__doeScope.engine.registerComponent("code-block", createDefinition());
}
