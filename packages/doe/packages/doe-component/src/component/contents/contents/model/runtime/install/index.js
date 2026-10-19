// Ordered assembly of independently owned DOE modules.
import { scope as __doeScope } from "../context/index.js";
import { initialize as unit0 } from "../../initialization/contents-type/index.js";
import { initialize as unit1 } from "../../initialization/common/index.js";
import { initialize as unit2 } from "../../initialization/cards/index.js";
import { initialize as unit3 } from "../../initialization/choices/index.js";
import { initialize as unit4 } from "../../initialization/clone/index.js";
import { initialize as unit5 } from "../../initialization/present/index.js";
import { initialize as unit6 } from "../../initialization/keys-allowed/index.js";
import { initialize as unit7 } from "../../initialization/item-keys/index.js";
import { initialize as unit16 } from "../../initialization/step-016/index.js";

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
  if (unit16()?.stop) return;
}
