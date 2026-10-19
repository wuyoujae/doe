// Ordered assembly of independently owned DOE modules.
import { scope as __doeScope } from "../context/index.js";
import { initialize as unit0 } from "../../processing/initialization/theme-id/index.js";
import { initialize as unit1 } from "../../processing/initialization/legacy-theme-ids/index.js";
import { initialize as unit3 } from "../../processing/initialization/yrkie-theme/index.js";
import { initialize as unit4 } from "../../processing/initialization/legacy-color-to-path/index.js";
import { initialize as unit5 } from "../../processing/initialization/hex-re/index.js";
import { initialize as unit6 } from "../../processing/initialization/background-re/index.js";
import { initialize as unit7 } from "../../processing/initialization/color-attrs/index.js";
import { initialize as unit21 } from "../../processing/initialization/step-021/index.js";
import { initialize as unit22 } from "../../processing/initialization/step-022/index.js";

export function install(global = window) {
  __doeScope.global = global;
  if (unit0()?.stop) return;
  if (unit1()?.stop) return;
  if (unit3()?.stop) return;
  if (unit4()?.stop) return;
  if (unit5()?.stop) return;
  if (unit6()?.stop) return;
  if (unit7()?.stop) return;
  if (unit21()?.stop) return;
  if (unit22()?.stop) return;
}
