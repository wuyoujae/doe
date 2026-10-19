// Ordered assembly of independently owned DOE modules.
import { scope as __doeScope } from "../context/index.js";
import { initialize as unit0 } from "../../initialization/svg-ns/index.js";
import { initialize as unit1 } from "../../initialization/default-series-colors/index.js";
import { initialize as unit2 } from "../../initialization/font-stack/index.js";
import { initialize as unit3 } from "../../initialization/semibold-weight/index.js";
import { initialize as unit4 } from "../../initialization/library/index.js";
import { initialize as unit5 } from "../../initialization/measurement-context/index.js";
import { initialize as unit25 } from "../../initialization/step-025/index.js";

export function install(global = window) {
  __doeScope.global = global;
  if (unit0()?.stop) return;
  if (unit1()?.stop) return;
  if (unit2()?.stop) return;
  if (unit3()?.stop) return;
  if (unit4()?.stop) return;
  if (unit5()?.stop) return;
  if (unit25()?.stop) return;
}
