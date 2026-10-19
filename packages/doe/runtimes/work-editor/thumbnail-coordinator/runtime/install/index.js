// Ordered assembly of independently owned DOE modules.
import { scope as __doeScope } from "../context/index.js";
import { initialize as unit4 } from "../../initialization/thumbnail-coordinator/index.js";
import { initialize as unit5 } from "../../initialization/step-005/index.js";

export function install(global = window) {
  __doeScope.global = global;
  if (unit4()?.stop) return;
  if (unit5()?.stop) return;
}
