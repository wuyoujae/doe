import { closeCustomSelect as __doeFn_closeCustomSelect } from '../close-custom-select/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:960
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function closeCustomSelects(except = null) {
    __doeScope.elements.settings?.querySelectorAll(".work-editor__custom-select").forEach((select) => {
      if (select === except) return;
      (0, __doeFn_closeCustomSelect)(select);
    });
  }
