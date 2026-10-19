// Ordered assembly of independently owned DOE modules.
import { scope as __doeScope } from "../context/index.js";
import { initialize as unit5 } from "../../../../../../layout/collection/initialization/step-005/index.js";

export function install(global = window) {
  __doeScope.global = global;
  if (unit5()?.stop) return;
}
