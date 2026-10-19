// Origin: public/yrkie-doe/work-editor/work-editor.js:6
import { scope as __doeScope } from "../../../../../integrations/work/editor/runtime/context/index.js";

export function initialize() {
if (__doeScope.runtimeSurface === "work") {
    document.documentElement.dataset.runtimeSurface = "work";
    if (__doeScope.runtimeParams.get("layout") === "doe-work") {
      document.documentElement.dataset.editorLayout = "doe-work";
    }
  }
}
