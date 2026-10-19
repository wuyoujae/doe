// Ordered assembly of independently owned DOE modules.
import { scope as __doeScope } from "../context/index.js";
import { initialize as unit0 } from "../../initialization/engine/index.js";
import { initialize as unit1 } from "../../initialization/variants/index.js";
import { initialize as unit2 } from "../../initialization/connected/index.js";
import { initialize as unit6 } from "../../initialization/step-006/index.js";

export function install(global = window) {
  __doeScope.global = global;
  if (unit0()?.stop) return;
  if (unit1()?.stop) return;
  if (unit2()?.stop) return;
  if (unit6()?.stop) return;
}
