// Ordered assembly of independently owned DOE modules.
import { scope as __doeScope } from "../context/index.js";
import { initialize as unit0 } from "../../../initialization/pt-to-px/index.js";
import { initialize as unit1 } from "../../../initialization/layout-cache-limit/index.js";
import { initialize as unit2 } from "../../../initialization/layout-cache/index.js";
import { initialize as unit3 } from "../../../initialization/default-terms/index.js";
import { initialize as unit4 } from "../../../initialization/forbidden-line-start/index.js";
import { initialize as unit5 } from "../../../initialization/forbidden-line-end/index.js";
import { initialize as unit6 } from "../../../initialization/closing-punctuation/index.js";
import { initialize as unit7 } from "../../../initialization/opening-punctuation/index.js";
import { initialize as unit8 } from "../../../initialization/atomic-value/index.js";
import { initialize as unit36 } from "../../../initialization/step-036/index.js";

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
  if (unit8()?.stop) return;
  if (unit36()?.stop) return;
}
