import { autoPlanPolicy as __doeFn_autoPlanPolicy } from '../../auto-plan-policy/index.js';
// Origin: public/yrkie-doe/layout-engine/ai-layout-compiler.js:2102
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.engine.registerLayoutPolicy("plan-by-capability", {
    phase: "compile",
    priority: 30,
    apply: __doeFn_autoPlanPolicy,
  });
}
