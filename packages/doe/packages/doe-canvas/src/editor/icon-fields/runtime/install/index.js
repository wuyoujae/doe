// Ordered assembly of independently owned DOE modules.
import { scope as __doeScope } from "../context/index.js";
import { initialize as unit0 } from "../../initialization/read/index.js";
import { initialize as unit4 } from "../../initialization/step-004/index.js";

export function install(global = window) {
  __doeScope.global = global;
  if (unit0()?.stop) return;
  if (unit4()?.stop) return;
}
