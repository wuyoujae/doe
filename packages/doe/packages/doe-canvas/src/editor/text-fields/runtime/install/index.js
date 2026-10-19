// Ordered assembly of independently owned DOE modules.
import { scope as __doeScope } from "../context/index.js";
import { initialize as unit0 } from "../../initialization/path-of/index.js";
import { initialize as unit1 } from "../../initialization/read/index.js";
import { initialize as unit8 } from "../../initialization/step-008/index.js";

export function install(global = window) {
  __doeScope.global = global;
  if (unit0()?.stop) return;
  if (unit1()?.stop) return;
  if (unit8()?.stop) return;
}
