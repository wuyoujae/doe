import { commitPageNumberSettings as __doeFn_commitPageNumberSettings } from '../../commit-page-number-settings/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:1534
import { scope as __doeScope } from "../../../../../integrations/work/editor/runtime/context/index.js";

export function initialize() {
__doeScope.elements.pageNumberEnabled.addEventListener("click", () => {
    const enabled = __doeScope.elements.pageNumberEnabled.getAttribute("aria-checked") !== "true";
    void (0, __doeFn_commitPageNumberSettings)(enabled ? "显示页码" : "隐藏页码", (draft) => {
      draft.enabled = enabled;
    });
  });
}
