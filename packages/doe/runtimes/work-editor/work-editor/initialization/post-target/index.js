// Origin: public/yrkie-doe/work-editor/work-editor.js:31
import { scope as __doeScope } from "../../../../../integrations/work/editor/runtime/context/index.js";

export function initialize() {
__doeScope.POST_TARGET = (() => {
    try {
      return new URL(document.referrer).origin;
    } catch (_error) {
      return "*";
    }
  })();
}
