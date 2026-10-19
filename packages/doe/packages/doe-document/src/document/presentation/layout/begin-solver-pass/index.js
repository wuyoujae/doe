// Origin: public/yrkie-doe/layout-engine/layout-engine.js:8530
import { scope as __doeScope } from "../../runtime/context/index.js";

export function beginSolverPass(state) {
    state.solverPerformance = {
      measurements: 0,
      runs: 0,
      elapsedMs: 0,
      activeStartedAt: null,
      measurementBudget: __doeScope.SOLVER_LIMITS.measurementsPerRebuild,
      elapsedBudgetMs: __doeScope.SOLVER_LIMITS.elapsedMsPerRebuild,
      budgetReached: false,
    };
  }
