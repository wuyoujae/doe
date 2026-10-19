import { solveLayoutWithinBudget as __doeFn_solveLayoutWithinBudget } from '../solve-layout-within-budget/index.js';
import { solveFlowLayout } from '../flow/solve.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:9463


export function solveLayout(state) {
    // Fonts, animation frames and other canvases may wait between solves.
    // Only charge this canvas for its own synchronous layout work.
    const performance = state.solverPerformance;
    if (performance) performance.activeStartedAt = Date.now();
    try {
      return state.flowLayout ? solveFlowLayout(state) : (0, __doeFn_solveLayoutWithinBudget)(state);
    } finally {
      if (performance) {
        performance.elapsedMs += Date.now() - performance.activeStartedAt;
        performance.activeStartedAt = null;
      }
    }
  }
