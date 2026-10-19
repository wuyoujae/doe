import { setActiveSlide as __doeFn_setActiveSlide } from '../../set-active-slide/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:1459
import { scope as __doeScope } from "../../../../../integrations/work/editor/runtime/context/index.js";

export function initialize() {
__doeScope.elements.next.addEventListener("click", () => void (0, __doeFn_setActiveSlide)(__doeScope.state.activeIndex + 1));
}
