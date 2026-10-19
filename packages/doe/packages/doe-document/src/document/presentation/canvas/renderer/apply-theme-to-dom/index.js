// Origin: public/yrkie-doe/layout-engine/layout-engine.js:10288
import { scope as __doeScope } from "../../../runtime/context/index.js";

export function applyThemeToDom(state) {
    const apply = __doeScope.global.PPTTheme && __doeScope.global.PPTTheme.apply;
    if (!apply || !state.slideElement) return;
    apply(state.slideElement, state.theme);
  }
