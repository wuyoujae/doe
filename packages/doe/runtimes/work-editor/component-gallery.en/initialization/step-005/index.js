import { translate as __doeFn_translate } from '../../translate/index.js';
// Origin: public/yrkie-doe/work-editor/component-gallery.en.js:342
import { scope as __doeScope } from "../../../../../studio/gallery/english/runtime/context/index.js";

export function initialize() {
__doeScope.global.SlideDemoSchemasEnglish = __doeScope.sourceSchemas.map((entry, index) =>
    (0, __doeFn_translate)(entry, `SlideDemoSchemas[${index}]`),
  );
}
