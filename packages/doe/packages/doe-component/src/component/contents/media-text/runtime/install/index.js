// Ordered assembly of independently owned DOE modules.
import { scope as __doeScope } from "../context/index.js";
import { initialize as unit0 } from "../../initialization/engine/index.js";
import { initialize as unit2 } from "../../initialization/step-002/index.js";
import { initialize as unit3 } from "../../initialization/step-003/index.js";

export function install(global = window) {
  __doeScope.global = global;
  if (unit0()?.stop) return;
  if (unit2()?.stop) return;
  if (unit3()?.stop) return;
}
