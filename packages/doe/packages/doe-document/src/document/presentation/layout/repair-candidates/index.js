import { findLocation as __doeFn_findLocation } from '../../../../../../doe-core/src/operation/find-location/index.js';
import { nodeLayoutProfile as __doeFn_nodeLayoutProfile } from '../node-layout-profile/index.js';
import { isCompositionGroup as __doeFn_isCompositionGroup } from '../is-composition-group/index.js';
import { makeRepairGroup as __doeFn_makeRepairGroup } from '../make-repair-group/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:10091
import { scope as __doeScope } from "../../runtime/context/index.js";

export function repairCandidates(state, report) {
    const seen = new Set();
    const candidates = [];
    [...__doeScope.layoutPolicies.values()]
      .filter(
        (policy) =>
          policy.phase === "repair" && typeof policy.propose === "function",
      )
      .sort((a, b) => a.priority - b.priority)
      .forEach((policy) => {
        let proposed = [];
        try {
          proposed = policy.propose({
            state,
            report,
            helpers: {
              findLocation: __doeFn_findLocation,
              nodeLayoutProfile: __doeFn_nodeLayoutProfile,
              isCompositionGroup: __doeFn_isCompositionGroup,
              makeRepairGroup: __doeFn_makeRepairGroup,
            },
          });
        } catch (error) {
          state.runtimeDiagnostics.push({
            code: "repair-policy-failed",
            level: "error",
            policy: policy.id,
            message: error.message,
          });
        }
        (Array.isArray(proposed) ? proposed : []).forEach((candidate) => {
          if (
            !candidate?.id ||
            typeof candidate.apply !== "function" ||
            seen.has(candidate.id)
          ) {
            return;
          }
          seen.add(candidate.id);
          candidates.push(candidate);
        });
      });
    // Layout measurement is intentionally bounded. A plugin can propose many
    // repairs, but only its highest-priority candidates enter this pass.
    return candidates
      .sort((a, b) => (Number(a.cost) || 0) - (Number(b.cost) || 0))
      .slice(0, __doeScope.SOLVER_LIMITS.repairCandidatesPerPass);
  }
