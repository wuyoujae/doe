// Origin: public/yrkie-doe/work-editor/component-gallery.en.js:325
import { scope as __doeScope } from "../../../../../studio/gallery/english/runtime/context/index.js";

export function initialize() {
__doeScope.containsHan = (value) => /[\u3400-\u9fff\uf900-\ufaff]/u.test(value);
}
