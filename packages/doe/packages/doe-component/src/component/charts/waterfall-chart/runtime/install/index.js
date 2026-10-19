// Ordered assembly of independently owned DOE modules.
import { scope as __doeScope } from "../context/index.js";
import { initialize as unit0 } from "../../initialization/utils/index.js";
import { initialize as unit1 } from "../../initialization/library/index.js";
import { initialize as unit2 } from "../../initialization/body-color/index.js";
import { initialize as unit3 } from "../../initialization/primary-color/index.js";
import { initialize as unit4 } from "../../initialization/light-color/index.js";
import { initialize as unit5 } from "../../initialization/deep-color/index.js";
import { initialize as unit6 } from "../../initialization/end-color/index.js";
import { initialize as unit7 } from "../../initialization/on-primary-color/index.js";
import { initialize as unit8 } from "../../initialization/font-stack/index.js";
import { initialize as unit9 } from "../../initialization/semibold-weight/index.js";
import { initialize as unit10 } from "../../initialization/normal-font-size/index.js";
import { initialize as unit11 } from "../../initialization/baseline-gap/index.js";
import { initialize as unit12 } from "../../initialization/zero-epsilon/index.js";
import { initialize as unit26 } from "../../initialization/step-026/index.js";

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
  if (unit26()?.stop) return;
}
