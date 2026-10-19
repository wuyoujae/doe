// Ordered assembly of independently owned DOE modules.
import { scope as __doeScope } from "../context/index.js";
import { initialize as unit0 } from "../../initialization/library/index.js";
import { initialize as unit1 } from "../../initialization/space-densities/index.js";
import { initialize as unit2 } from "../../initialization/border-styles/index.js";
import { initialize as unit3 } from "../../initialization/column-sizing-modes/index.js";
import { initialize as unit4 } from "../../initialization/text-measure-cache/index.js";
import { initialize as unit36 } from "../../initialization/step-036/index.js";

export function install(global = window) {
  __doeScope.global = global;
  if (unit0()?.stop) return;
  if (unit1()?.stop) return;
  if (unit2()?.stop) return;
  if (unit3()?.stop) return;
  if (unit4()?.stop) return;
  if (unit36()?.stop) return;
}
