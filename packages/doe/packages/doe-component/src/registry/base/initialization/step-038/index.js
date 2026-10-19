import { createDefinition } from '../../../../component/base/heading/definition/index.js';
// Origin: public/yrkie-doe/layout-engine/components.js:436
import { scope as __doeScope } from "../../../runtime/base/context/index.js";

export function initialize() {
__doeScope.engine.registerComponent("heading", createDefinition());
}
