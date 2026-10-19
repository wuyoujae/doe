// Ordered assembly of independently owned DOE modules.
import { scope as __doeScope } from "../context/index.js";
import { initialize as unit0 } from "../../initialization/utils/index.js";
import { initialize as unit1 } from "../../initialization/library/index.js";
import { initialize as unit3 } from "../../initialization/primary-color/index.js";
import { initialize as unit4 } from "../../initialization/body-color/index.js";
import { initialize as unit5 } from "../../initialization/surface-color/index.js";
import { initialize as unit6 } from "../../initialization/on-primary-color/index.js";
import { initialize as unit7 } from "../../initialization/font-stack/index.js";
import { initialize as unit8 } from "../../initialization/theme-typography/index.js";
import { initialize as unit66 } from "../../initialization/default-font/index.js";
import { initialize as unit68 } from "../../initialization/manual-lines/index.js";
import { initialize as unit69 } from "../../initialization/line-width/index.js";
import { initialize as unit82 } from "../../initialization/step-082/index.js";
import { initialize as unit83 } from "../../initialization/step-083/index.js";

export function install(global = window) {
  __doeScope.global = global;
  if (unit0()?.stop) return;
  if (unit1()?.stop) return;
  if (unit3()?.stop) return;
  if (unit4()?.stop) return;
  if (unit5()?.stop) return;
  if (unit6()?.stop) return;
  if (unit7()?.stop) return;
  if (unit8()?.stop) return;
  if (unit66()?.stop) return;
  if (unit68()?.stop) return;
  if (unit69()?.stop) return;
  if (unit82()?.stop) return;
  if (unit83()?.stop) return;
}
