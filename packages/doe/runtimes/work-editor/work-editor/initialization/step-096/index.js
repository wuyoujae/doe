import { closeCustomSelects as __doeFn_closeCustomSelects } from '../../close-custom-selects/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:1595
import { scope as __doeScope } from "../../../../../integrations/work/editor/runtime/context/index.js";

export function initialize() {
__doeScope.global.addEventListener("resize", () => (0, __doeFn_closeCustomSelects)());
}
