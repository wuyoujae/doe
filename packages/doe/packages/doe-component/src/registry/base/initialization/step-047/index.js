import { createDefinition } from '../../../../component/base/todo-list/definition/index.js';
// Origin: public/yrkie-doe/layout-engine/components.js:1236
import { scope as __doeScope } from "../../../runtime/base/context/index.js";

export function initialize() {
__doeScope.engine.registerComponent("todo-list", createDefinition());
}
