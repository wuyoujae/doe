// Origin: public/yrkie-doe/work-editor/component-gallery.en.js:5
import { scope as __doeScope } from "../../../../../studio/gallery/english/runtime/context/index.js";

export function initialize() {
if (!Array.isArray(__doeScope.sourceSchemas)) {
    throw new Error("The English DOE gallery requires SlideDemoSchemas to load first.");
  }
}
