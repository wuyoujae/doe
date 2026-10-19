// Ordered assembly of independently owned DOE modules.
import { scope as __doeScope } from "../context/index.js";
import { initialize as unit0 } from "../../../../../runtimes/work-editor/component-gallery.en/initialization/source-schemas/index.js";
import { initialize as unit1 } from "../../../../../runtimes/work-editor/component-gallery.en/initialization/step-001/index.js";
import { initialize as unit2 } from "../../../../../runtimes/work-editor/component-gallery.en/initialization/translations/index.js";
import { initialize as unit3 } from "../../../../../runtimes/work-editor/component-gallery.en/initialization/contains-han/index.js";
import { initialize as unit5 } from "../../../../../runtimes/work-editor/component-gallery.en/initialization/step-005/index.js";

export function install(global = window) {
  __doeScope.global = global;
  if (unit0()?.stop) return;
  if (unit1()?.stop) return;
  if (unit2()?.stop) return;
  if (unit3()?.stop) return;
  if (unit5()?.stop) return;
}
