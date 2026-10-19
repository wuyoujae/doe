import { positionTextToolbar as __doeFn_positionTextToolbar } from "../position-text-toolbar/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:1603
import { scope as __doeScope } from "../../../runtime/context/index.js";

export function positionSelectedTextToolbars(state) {
    const schedule = __doeScope.global.requestAnimationFrame || ((callback) => callback());
    schedule(() => {
      if (!state.slideElement) return;
      state.slideElement
        .querySelectorAll(".block-shell.is-selected > .text-edit-toolbar")
        .forEach((toolbar) => (0, __doeFn_positionTextToolbar)(toolbar, toolbar.parentElement, state));
    });
  }
