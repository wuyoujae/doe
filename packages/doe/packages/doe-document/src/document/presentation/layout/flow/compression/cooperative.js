import { solveLayout } from '../../solve-layout/index.js';
import { solveLocalFlowSteps } from './solve.js';
import { runStepsAsync } from './steps.js';
import { throwIfAborted } from '../../../../../../../doe-core/src/runtime/throw-if-aborted/index.js';

/** Mounts yield between complete measurements; live edit callers retain the sync API. */
export async function solveLayoutCooperatively(state) {
  if (!state.flowLayout || state.flowLayout.compression === 'page-v1') return solveLayout(state);
  const element = state.slideElement, opacity = element.style.opacity, inert = element.inert;
  element.style.opacity = '0'; element.inert = true;
  try {
    return await runStepsAsync(solveLocalFlowSteps(state), { checkpoint: () => throwIfAborted(state) });
  } finally {
    element.style.opacity = opacity; element.inert = inert;
  }
}
