// Ordered assembly of independently owned DOE modules.
import { scope as __doeScope } from "../context/index.js";
import { initialize as unit0 } from "../../initialization/open-to-close/index.js";
import { initialize as unit1 } from "../../initialization/close/index.js";
import { initialize as unit29 } from "../../initialization/step-029/index.js";

export function install(global = window) {
  __doeScope.global = global;
  if (unit0()?.stop) return;
  if (unit1()?.stop) return;
  if (unit29()?.stop) return;
}
