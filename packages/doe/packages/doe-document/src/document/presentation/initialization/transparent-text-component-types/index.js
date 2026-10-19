// Origin: public/yrkie-doe/layout-engine/layout-engine.js:17
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.TRANSPARENT_TEXT_COMPONENT_TYPES = new Set([
    "hero",
    "heading",
    "text",
    "list",
    "ordered-list",
    "todo-list",
    "quote",
  ]);
}
