// Ordered assembly of independently owned DOE modules.
import { scope as __doeScope } from "../context/index.js";
import { initialize as unit0 } from "../../initialization/utils/index.js";
import { initialize as unit1 } from "../../initialization/library/index.js";
import { initialize as unit2 } from "../../initialization/axis-color/index.js";
import { initialize as unit3 } from "../../initialization/node-color/index.js";
import { initialize as unit4 } from "../../initialization/default-band-colors/index.js";
import { initialize as unit5 } from "../../initialization/font-stack/index.js";
import { initialize as unit6 } from "../../initialization/semibold-weight/index.js";
import { initialize as unit7 } from "../../initialization/instance-count/index.js";
import { initialize as unit11 } from "../../initialization/step-011/index.js";

export function install(global = window) {
  __doeScope.global = global;
  if (unit0()?.stop) return;
  if (unit1()?.stop) return;
  if (unit2()?.stop) return;
  if (unit3()?.stop) return;
  if (unit4()?.stop) return;
  if (unit5()?.stop) return;
  if (unit6()?.stop) return;
  if (unit7()?.stop) return;
  if (unit11()?.stop) return;
}
