import { registerLayoutPolicy as __doeFn_registerLayoutPolicy } from '../../../../../../doe-core/src/registry/policy/index.js';
import { builtinRepairCandidates as __doeFn_builtinRepairCandidates } from '../../layout/builtin-repair-candidates/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:9455
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
if (!__doeScope.layoutPolicies.has("builtin-structural-repair")) {
    (0, __doeFn_registerLayoutPolicy)("builtin-structural-repair", {
      phase: "repair",
      priority: 50,
      propose: __doeFn_builtinRepairCandidates,
    });
  }
}
