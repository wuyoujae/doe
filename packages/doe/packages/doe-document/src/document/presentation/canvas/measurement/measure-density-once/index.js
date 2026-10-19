import { isContentsGroup as __doeFn_isContentsGroup } from "../../../layout/is-contents-group/index.js";
import { measureDensityContent as __doeFn_measureDensityContent } from "../measure-density-content/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:8312


export function measureDensityOnce(state, density) {
    if (!state.groupRecords.some(group => (0, __doeFn_isContentsGroup)(group.node)) && !state.leafRecords.some(leaf => leaf.definition.category === "contents")) {
      return (0, __doeFn_measureDensityContent)(state, density);
    }
    // Floating editor controls may overhang a narrow column. They are not
    // slide content and must not make a valid cross-column move fail preflight.
    state.host.classList.add("is-measuring-columns");
    try { return (0, __doeFn_measureDensityContent)(state, density); }
    finally { state.host.classList.remove("is-measuring-columns"); }
  }
