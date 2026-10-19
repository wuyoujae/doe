// Ordered assembly of independently owned DOE modules.
import { scope as __doeScope } from "../context/index.js";
import { initialize as unit0 } from "../../initialization/greek-map/index.js";
import { initialize as unit1 } from "../../initialization/operator-map/index.js";
import { initialize as unit2 } from "../../initialization/function-ops/index.js";
import { initialize as unit3 } from "../../initialization/bigop-family/index.js";
import { initialize as unit4 } from "../../initialization/limit-below/index.js";
import { initialize as unit5 } from "../../initialization/accent-mark/index.js";
import { initialize as unit6 } from "../../initialization/stretch-accents/index.js";
import { initialize as unit7 } from "../../initialization/spacing-map/index.js";
import { initialize as unit8 } from "../../initialization/delim-alias/index.js";
import { initialize as unit9 } from "../../initialization/open-delims/index.js";
import { initialize as unit10 } from "../../initialization/close-delims/index.js";
import { initialize as unit11 } from "../../initialization/text-commands/index.js";
import { initialize as unit12 } from "../../initialization/text-style/index.js";
import { initialize as unit13 } from "../../initialization/environments/index.js";
import { initialize as unit17 } from "../../initialization/ctrl-map/index.js";
import { initialize as unit19 } from "../../initialization/max-depth/index.js";
import { initialize as unit20 } from "../../initialization/max-tokens/index.js";
import { initialize as unit24 } from "../../initialization/mathml-ns/index.js";
import { initialize as unit41 } from "../../initialization/fit-observers/index.js";
import { initialize as unit45 } from "../../initialization/library/index.js";
import { initialize as unit46 } from "../../initialization/step-046/index.js";

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
  if (unit9()?.stop) return;
  if (unit10()?.stop) return;
  if (unit11()?.stop) return;
  if (unit12()?.stop) return;
  if (unit13()?.stop) return;
  if (unit17()?.stop) return;
  if (unit19()?.stop) return;
  if (unit20()?.stop) return;
  if (unit24()?.stop) return;
  if (unit41()?.stop) return;
  if (unit45()?.stop) return;
  if (unit46()?.stop) return;
}
