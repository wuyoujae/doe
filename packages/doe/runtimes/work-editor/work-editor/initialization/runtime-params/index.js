// Origin: public/yrkie-doe/work-editor/work-editor.js:4
import { scope as __doeScope } from "../../../../../integrations/work/editor/runtime/context/index.js";

export function initialize() {
__doeScope.runtimeParams = new URLSearchParams(__doeScope.global.location.search);
}
