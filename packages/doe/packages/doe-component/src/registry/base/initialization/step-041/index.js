import { createDefinition } from '../../../../component/base/media/definition/index.js';
// Origin: public/yrkie-doe/layout-engine/components.js:602
import { scope as __doeScope } from "../../../runtime/base/context/index.js";

export function initialize() {
__doeScope.engine.registerComponent("media", createDefinition());
}
