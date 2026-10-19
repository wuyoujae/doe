// Origin: public/yrkie-doe/work-editor/work-editor.js:844
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function currentSlide() {
    return __doeScope.state.slides[__doeScope.state.activeIndex];
  }
