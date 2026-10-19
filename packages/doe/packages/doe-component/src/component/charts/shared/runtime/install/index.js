// Ordered assembly of independently owned DOE modules.
import { scope as __doeScope } from "../context/index.js";
import { initialize as unit0 } from "../../../../../shared/chart/initialization/svg-ns/index.js";
import { initialize as unit1 } from "../../../../../shared/chart/initialization/measurement-context/index.js";
import { initialize as unit12 } from "../../../../../shared/chart/initialization/step-012/index.js";

export function install(global = window) {
  __doeScope.global = global;
  if (unit0()?.stop) return;
  if (unit1()?.stop) return;
  if (unit12()?.stop) return;
}
