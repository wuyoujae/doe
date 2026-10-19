// Origin: public/yrkie-doe/layout-engine/layout-engine.js:8542


export function reserveSolverBudget(state, measurements, elapsedMs) {
    const performance = state.solverPerformance;
    performance.measurementBudget = performance.measurements + measurements;
    performance.elapsedBudgetMs = performance.elapsedMs + elapsedMs;
    performance.budgetReached = false;
  }
