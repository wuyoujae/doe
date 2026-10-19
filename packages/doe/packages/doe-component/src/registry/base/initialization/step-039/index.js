import { createDefinition } from '../../../../component/contents/question-card/definition/index.js';
// Origin: public/yrkie-doe/layout-engine/components.js:463
import { scope as __doeScope } from "../../../runtime/base/context/index.js";

export function initialize() {
__doeScope.engine.registerComponent("question-card", createDefinition());
}
