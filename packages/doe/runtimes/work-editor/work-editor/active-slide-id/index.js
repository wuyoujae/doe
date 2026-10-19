// Origin: public/yrkie-doe/work-editor/work-editor.js:1113
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function activeSlideId() {
    return __doeScope.state.slides[__doeScope.state.activeIndex]?.id || null;
  }
