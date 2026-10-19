import { pageNumberSettings as __doeFn_pageNumberSettings } from '../page-number-settings/index.js';
// Origin: public/yrkie-doe/work-editor/work-editor.js:858
import { scope as __doeScope } from "../../../../integrations/work/editor/runtime/context/index.js";

export function slideMountOptions(index, total = __doeScope.state.slides.length, pageNumber = (0, __doeFn_pageNumberSettings)()) {
    return {
      logo: __doeScope.state.logo,
      pageNumber: {
        ...pageNumber,
        current: index + 1,
        total,
      },
    };
  }
