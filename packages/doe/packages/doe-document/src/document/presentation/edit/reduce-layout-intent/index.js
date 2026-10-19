import { deepClone as __doeFn_deepClone } from "../../../../../../doe-core/src/runtime/deep-clone/index.js";
import { applyLayoutIntent as __doeFn_applyLayoutIntent } from "../apply-layout-intent/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:3660


export function reduceLayoutIntent(slide, intent = {}) {
    const workingSlide = (0, __doeFn_deepClone)(slide);
    const state = {
      slide: workingSlide,
      selectedId: null,
      leafRecords: [],
      groupRecords: [],
      layoutElement: null,
    };
    const changed = (0, __doeFn_applyLayoutIntent)(state, intent);
    return { changed, slide: workingSlide, selectedId: state.selectedId };
  }
