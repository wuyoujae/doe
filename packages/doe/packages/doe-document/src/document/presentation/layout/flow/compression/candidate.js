import { normalizeCompression } from './policy.js';
import { paintedScale } from './targets.js';

const maps = ['autoItemColumns', 'flowColumns', 'flowHeightBudgets', 'flowContentBudgets', 'flowNaturalHeights', 'flowGeometry'];
const decisions = ['orientationDecisions', 'timelineDecisions'];

/** Candidate state never includes author nodes or DOM references to clone. */
export function captureCandidate(state) {
  return {
    plan: normalizeCompression(state.flowCompression),
    maps: Object.fromEntries(maps.map(key => [key, state[key] ? new Map(state[key]) : state[key]])),
    decisions: Object.fromEntries(decisions.map(key => [key, [...(state[key] || [])]])),
    budgetStable: state.flowBudgetStable, budgetPasses: state.flowBudgetPasses, naturalPressure: state.flowNaturalPressure,
  };
}

export function restoreCandidate(state, snapshot) {
  state.flowCompression = normalizeCompression(snapshot.plan);
  for (const key of maps) state[key] = snapshot.maps[key] ? new Map(snapshot.maps[key]) : snapshot.maps[key];
  for (const key of decisions) state[key] = [...snapshot.decisions[key]];
  state.flowBudgetStable = snapshot.budgetStable; state.flowBudgetPasses = snapshot.budgetPasses;
  state.flowNaturalPressure = snapshot.naturalPressure;
  state.pendingFlowPlan = null;
}

const average = values => values.length ? values.reduce((sum, n) => sum + n, 0) / values.length : 1;
export function isBodyField(field) {
  return !field.constraintOnly && field.path[0] !== '$label'
    && !/^H[1-6]$/.test(field.target?.tagName || '')
    && !['title', 'heading', 'subtitle', 'value', 'number'].includes(field.path.at(-1));
}

/** Compare final visible text, never the pre-fit sum of duplicated field pressure. */
export function candidateQuality(state, report, preferences = new Map()) {
  const bodies = [], headings = [];
  let projected = 0;
  for (const field of state.flowTextTargets || []) {
    if (field.constraintOnly || field.path[0] === '$label' || !field.target.getClientRects().length) continue;
    const ratio = Math.min(1, parseFloat(getComputedStyle(field.target).fontSize) * .75 * paintedScale(field.target) / field.basePt);
    if (Number.isFinite(ratio)) (isBodyField(field) ? bodies : headings).push(ratio);
    if (field.target.dataset.flowTruncated === 'true') projected++;
  }
  const internal = new Map();
  for (const p of report.internalPressure || []) internal.set(p.id, Math.max(internal.get(p.id) || 0,
    (p.overflowX || 0) + (p.overflowY || 0) + Number(Boolean(p.blocked))));
  const hard = (report.minFontViolations || 0) + (report.compressionFitViolations || 0) + (report.overlaps || 0);
  const pressure = (report.overflowX || 0) + (report.overflowY || 0) + [...internal.values()].reduce((sum, n) => sum + n, 0);
  const changes = [...preferences].filter(([id, value]) => state.autoItemColumns.get(id) !== value).length
    + Object.keys(state.flowCompression.orientation).length + Object.keys(state.flowCompression.timeline).length;
  let narrowness = 0;
  for (const record of state.leafRecords || []) {
    const columns = state.autoItemColumns?.get(record.node.id), geometry = state.flowGeometry?.get(record.node.id);
    const minimum = record.definition?.columnMinWidth;
    if (!columns || !geometry || !minimum) continue;
    const gap = parseFloat(getComputedStyle(record.element).getPropertyValue('--item-cards-gap')) || 24;
    const width = ((geometry.contentSlotWidth ?? geometry.slotWidth) - gap * (columns - 1)) / columns;
    narrowness += Math.max(0, 1 - width / minimum);
  }
  return [Number(report.fits), -hard, -projected, -pressure,
    Math.min(1, ...bodies), average(bodies), Math.min(1, ...headings), average(headings), -narrowness, -changes];
}

/** Strict improvement only: equal/failed probes cannot displace a legal baseline. */
export function betterCandidate(candidate, baseline) {
  if (!baseline) return true;
  for (let index = 0; index < candidate.length; index++) {
    const difference = candidate[index] - baseline[index];
    // Typography is searched to 0.01pt; smaller differences are measurement noise.
    const epsilon = index >= 4 && index <= 7 ? .0005 : 1e-6;
    if (Math.abs(difference) > epsilon) return difference > 0;
  }
  return false;
}
