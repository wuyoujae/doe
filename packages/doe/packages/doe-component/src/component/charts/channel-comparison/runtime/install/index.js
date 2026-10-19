// Ordered assembly of independently owned DOE modules.
import { scope as __doeScope } from "../context/index.js";
import { initialize as unit0 } from "../../initialization/utils/index.js";
import { initialize as unit1 } from "../../initialization/step-001/index.js";
import { initialize as unit2 } from "../../initialization/library/index.js";
import { initialize as unit8 } from "../../initialization/step-008/index.js";

export function install(global = window) {
  __doeScope.global = global;
  if (unit0()?.stop) return;
  if (unit1()?.stop) return;
  if (unit2()?.stop) return;
  if (unit8()?.stop) return;
}
