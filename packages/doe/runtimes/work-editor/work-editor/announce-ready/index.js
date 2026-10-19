import { post as __doeFn_post } from '../post/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:552
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function announceReady() {
    if (!__doeScope.state.initialized) return;
    (0, __doeFn_post)("ready", { index: __doeScope.state.activeIndex, total: __doeScope.state.slides.length });
  }
