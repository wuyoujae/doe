// Ordered assembly of independently owned DOE modules.
import { scope as __doeScope } from "../context/index.js";
import { initialize as unit0 } from "../../initialization/utils/index.js";
import { initialize as unit1 } from "../../initialization/step-001/index.js";
import { initialize as unit2 } from "../../initialization/library/index.js";
import { initialize as unit3 } from "../../initialization/default-colors/index.js";
import { initialize as unit4 } from "../../initialization/default-donut-colors/index.js";
import { initialize as unit6 } from "../../initialization/body-color/index.js";
import { initialize as unit7 } from "../../initialization/primary-color/index.js";
import { initialize as unit8 } from "../../initialization/surface-color/index.js";
import { initialize as unit9 } from "../../initialization/soft-surface-color/index.js";
import { initialize as unit10 } from "../../initialization/on-primary-color/index.js";
import { initialize as unit11 } from "../../initialization/font-stack/index.js";
import { initialize as unit12 } from "../../initialization/semibold-weight/index.js";
import { initialize as unit13 } from "../../initialization/typography-pixel-size/index.js";
import { initialize as unit26 } from "../../initialization/icon-paths/index.js";
import { initialize as unit27 } from "../../initialization/lucide-icon-aliases/index.js";
import { initialize as unit36 } from "../../initialization/step-036/index.js";
import { initialize as unit38 } from "../../initialization/step-038/index.js";

export function install(global = window) {
  __doeScope.global = global;
  if (unit0()?.stop) return;
  if (unit1()?.stop) return;
  if (unit2()?.stop) return;
  if (unit3()?.stop) return;
  if (unit4()?.stop) return;
  if (unit6()?.stop) return;
  if (unit7()?.stop) return;
  if (unit8()?.stop) return;
  if (unit9()?.stop) return;
  if (unit10()?.stop) return;
  if (unit11()?.stop) return;
  if (unit12()?.stop) return;
  if (unit13()?.stop) return;
  if (unit26()?.stop) return;
  if (unit27()?.stop) return;
  if (unit36()?.stop) return;
  if (unit38()?.stop) return;
}
