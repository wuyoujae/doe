// Ordered assembly of independently owned DOE modules.
import { scope as __doeScope } from "../context/index.js";
import { initialize as unit0 } from "../../initialization/engine/index.js";
import { initialize as unit1 } from "../../initialization/step-001/index.js";
import { initialize as unit2 } from "../../initialization/max-items/index.js";
import { initialize as unit3 } from "../../initialization/max-depth/index.js";
import { initialize as unit4 } from "../../initialization/max-collection-items/index.js";
import { initialize as unit5 } from "../../initialization/default-inner-width/index.js";
import { initialize as unit6 } from "../../initialization/public-component-props/index.js";
import { initialize as unit7 } from "../../initialization/public-leaf-layout-props/index.js";
import { initialize as unit8 } from "../../initialization/public-group-layout-props/index.js";
import { initialize as unit9 } from "../../initialization/public-slide-layout-props/index.js";
import { initialize as unit10 } from "../../initialization/public-node-props/index.js";
import { initialize as unit11 } from "../../initialization/public-group-node-props/index.js";
import { initialize as unit12 } from "../../initialization/public-slide-props/index.js";
import { initialize as unit13 } from "../../initialization/space-values/index.js";
import { initialize as unit14 } from "../../initialization/layout-lock-values/index.js";
import { initialize as unit65 } from "../../initialization/root-evidence-types/index.js";
import { initialize as unit70 } from "../../initialization/step-070/index.js";
import { initialize as unit71 } from "../../initialization/step-071/index.js";
import { initialize as unit72 } from "../../initialization/step-072/index.js";
import { initialize as unit74 } from "../../initialization/step-074/index.js";

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
  if (unit14()?.stop) return;
  if (unit65()?.stop) return;
  if (unit70()?.stop) return;
  if (unit71()?.stop) return;
  if (unit72()?.stop) return;
  if (unit74()?.stop) return;
}
