// Origin: public/yrkie-doe/layout-engine/layout-engine.js:70
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.SOLVER_LIMITS = Object.freeze({
    structuralCandidates: 12,
    itemColumnCandidates: 12,
    localTypographyCandidates: 24,
    repairCandidatesPerPass: 6,
    repairEvaluations: 12,
    measurementsPerRepair: 24,
    elapsedMsPerRepair: 400,
    // Candidate limits above are per axis. Without a shared page budget they
    // multiply (structure × item columns × density × spacing × repair) and a
    // dense component page can monopolize the browser main thread. These two
    // limits bound the initial search and restoration. Repair candidates get
    // their own smaller budget, capped by repairEvaluations across all passes.
    measurementsPerRebuild: 72,
    elapsedMsPerRebuild: 1200,
    reportedAttempts: 96,
  });
}
