import { createDefinition } from '../../../../component/internal/unsupported/definition/index.js';
// Origin: public/yrkie-doe/layout-engine/components.js:315
import { scope as __doeScope } from "../../../runtime/base/context/index.js";

export function initialize() {
__doeScope.engine.registerComponent("unsupported", createDefinition());
}
