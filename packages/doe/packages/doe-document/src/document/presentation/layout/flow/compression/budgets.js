import { SAFE_EDGE_EPSILON } from './pressure.js';

function different(left, right) {
  return !left || left.size !== right.size || [...right].some(([id, value]) =>
    !left.has(id) || Math.abs(value - left.get(id)) > SAFE_EDGE_EPSILON);
}

/** Renderers must consume the current budget, not merely report against it. */
export function settleBudgetMeasurements(state, render, contentBudgets, heightBudgets, pressure) {
  let result;
  for (let pass = 0; pass < 6; pass++) {
    result = render();
    const content = contentBudgets();
    const heights = state.flowNaturalHeights?.size ? heightBudgets() : state.flowHeightBudgets;
    const changed = different(state.flowContentBudgets, content) || different(state.flowHeightBudgets, heights);
    state.flowContentBudgets = content;
    state.flowHeightBudgets = heights;
    state.flowBudgetPasses = pass + 1;
    state.flowBudgetStable = !changed;
    if (!changed) break;
  }
  result = pressure(result.spacing);
  // An oscillating adapter is not an accepted layout. Bound work and expose it.
  return state.flowBudgetStable ? result : { ...result, fits: false, budgetConvergenceViolations: 1 };
}
