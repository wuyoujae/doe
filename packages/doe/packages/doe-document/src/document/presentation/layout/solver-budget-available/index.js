import { throwIfAborted as __doeFn_throwIfAborted } from '../../../../../../doe-core/src/runtime/throw-if-aborted/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:8508
import { scope as __doeScope } from "../../runtime/context/index.js";

export function solverBudgetAvailable(state) {
    (0, __doeFn_throwIfAborted)(state);
    const performance = state.solverPerformance;
    if (!performance) return true;
    const measurementBudget = Math.max(
      1,
      Number(performance.measurementBudget) ||
        __doeScope.SOLVER_LIMITS.measurementsPerRebuild,
    );
    const elapsedBudget = Math.max(
      1,
      Number(performance.elapsedBudgetMs) ||
        __doeScope.SOLVER_LIMITS.elapsedMsPerRebuild,
    );
    const available =
      performance.measurements < measurementBudget &&
      performance.elapsedMs + (performance.activeStartedAt === null
        ? 0 : Date.now() - performance.activeStartedAt) < elapsedBudget;
    if (!available) performance.budgetReached = true;
    return available;
  }
