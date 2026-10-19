import { normalizeCompression } from './policy.js';
import { rememberCompression } from './cache.js';

/** Only a completely accepted frame may become a persistent/cache candidate. */
export function commitFlowPlan(state, report) {
  const pending = state.pendingFlowPlan;
  state.pendingFlowPlan = null;
  if (!pending || !report.fits || state.previewEnumTextFit || state.flowPreview || state.signal?.aborted) return false;
  state.slide.layout.compression = normalizeCompression(pending.plan);
  rememberCompression(pending.cacheKey, pending.plan);
  return true;
}
