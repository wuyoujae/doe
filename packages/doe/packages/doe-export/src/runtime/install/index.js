// Ordered assembly of independently owned DOE modules.
import { scope as __doeScope } from "../context/index.js";
import { initialize as unit0 } from "../../format/pptx/browser/export-runtime/initialization/root/index.js";
import { initialize as unit1 } from "../../format/pptx/browser/export-runtime/initialization/active-result/index.js";
import { initialize as unit2 } from "../../format/pptx/browser/export-runtime/initialization/font-probes/index.js";
import { initialize as unit3 } from "../../format/pptx/browser/export-runtime/initialization/frozen-style-properties/index.js";
import { initialize as unit18 } from "../../format/pptx/browser/export-runtime/initialization/step-018/index.js";

export function install(global = window) {
  __doeScope.global = global;
  if (unit0()?.stop) return;
  if (unit1()?.stop) return;
  if (unit2()?.stop) return;
  if (unit3()?.stop) return;
  if (unit18()?.stop) return;
}
