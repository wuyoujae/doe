import { automaticItemColumnCandidates as __doeFn_automaticItemColumnCandidates } from "../../../layout/automatic-item-column-candidates/index.js";
import { solverBudgetAvailable as __doeFn_solverBudgetAvailable } from "../../../layout/solver-budget-available/index.js";
import { measureDensityOnce as __doeFn_measureDensityOnce } from "../measure-density-once/index.js";
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:8549


export function measureDensity(state, density, options = {}) {
    const allCandidates =
      state.solverItemColumnCandidates ||
      (state.solverItemColumnCandidates = (0, __doeFn_automaticItemColumnCandidates)(state));
    // Collection reflow is a secondary axis. During the first structural
    // sweep every reading-axis candidate must receive one fair measurement;
    // otherwise an early row can spend the complete elapsed-time budget on
    // 1/2/3/4-column permutations before a later (often safe) stack is ever
    // visited. Promising structures are deepened in a bounded second pass.
    const requestedLimit = Number(options.candidateLimit);
    const requestedOffset = Number(options.candidateOffset);
    const candidateOffset = Number.isFinite(requestedOffset)
      ? Math.max(0, Math.round(requestedOffset))
      : 0;
    const candidates = Number.isFinite(requestedLimit)
      ? allCandidates.slice(
          candidateOffset,
          candidateOffset + Math.max(1, Math.round(requestedLimit)),
        )
      : allCandidates.slice(candidateOffset);
    let best = null;
    for (const candidate of candidates) {
      if (!(0, __doeFn_solverBudgetAvailable)(state)) break;
      state.autoItemColumns = candidate.columns;
      const attempt = (0, __doeFn_measureDensityOnce)(state, density);
      attempt.autoItemColumns = new Map(candidate.columns);
      attempt.layoutFallbackSteps = candidate.steps;
      // Alternative reflow is intentionally much cheaper than moving to a
      // smaller semantic typography density.
      attempt.score += candidate.steps * 200;
      if (attempt.fits) return attempt;
      if (!best || attempt.score < best.score) best = attempt;
    }
    return best;
  }
