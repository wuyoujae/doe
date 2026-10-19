import { COMPRESSION_POLICY, validNestedFactors } from './policy.js';
import { slotBudgets, SAFE_EDGE_EPSILON } from './pressure.js';
import { scope } from '../../../runtime/context/index.js';
import { isLayoutFeatureLocked } from '../../is-layout-feature-locked/index.js';
import { captureCandidate, restoreCandidate } from './candidate.js';
import { paintedScale } from './targets.js';
import { continuousTextPeers } from './item-text.js';
import { setItemTextRatio } from './continuous.js';

/** Uniform scaling preserves topology, but changes every descendant's visible type size. */
export function scalableFlowSurfaces(state) {
  const records = new Map(state.leafRecords.map(record => [record.node.id, record]));
  const allowed = new Map();
  function visit(node, inherited = false) {
    const locked = inherited || isLayoutFeatureLocked(node, 'typography') || isLayoutFeatureLocked(node, 'all');
    const children = node.children?.map(child => visit(child, locked));
    const value = !locked && (children ? children.every(Boolean) : records.get(node.id)?.flowContract?.surfaceScale === 'uniform');
    allowed.set(node.id, value);
    return value;
  }
  state.slide.blocks.forEach(node => visit(node));
  return allowed;
}

/** Logical copy compensates for zoom; the final painted glyph still owns the floor. */
export function compensateSurfaceTypography(fields, plan, scales, enumText = false) {
  const visited = new Set();
  for (const field of fields) {
    if (visited.has(field.key)) continue;
    const peers = continuousTextPeers(fields, field);
    peers.forEach(peer => visited.add(peer.key));
    const current = peer => plan.textRatio[peer.key] ?? peer.ladder[Math.min(peer.ladder.length - 1, plan.text[peer.key] || 0)] / peer.basePt;
    const required = peer => Math.ceil((peer.ladder.at(-1) / scales.get(peer.key) - 1e-8) * 100) / 100;
    const ratio = Math.max(...peers.map(peer => Math.max(current(peer), required(peer) / (Math.round(peer.basePt * 1000) / 1000))));
    if (!Number.isFinite(ratio) || ratio > 1 + 1e-9) return false;
    for (const peer of peers) {
      // Native labels and locked rich text are measured, never enlarged to evade a floor.
      if (peer.constraintOnly || peer.typographyLocked || peer.path[0] === '$label') {
        if (peer.basePt * current(peer) * scales.get(peer.key) + .011 < peer.ladder.at(-1)) return false;
        continue;
      }
      delete plan.text[peer.key];
      if (enumText) {
        delete plan.textRatio[peer.key];
        const index = peer.ladder.findLastIndex(size => size + 1e-9 >= ratio * peer.basePt);
        if (index > 0) plan.text[peer.key] = index;
      } else setItemTextRatio(plan, [peer], ratio);
    }
  }
  return true;
}

/** A fixed surface may yield height even when a later sibling is the one outside SafeArea. */
export function* compensateSurfaceSteps(state, row, measure, report, { allowed, changed = false }) {
  const { id, key, record, element } = row.units[0];
  if (!allowed.get(id)) return false;
  const baseline = report();
  const subtree = new Set();
  const visit = node => { subtree.add(node.id); node.children?.forEach(visit); };
  visit(record.node);
  const owns = fieldKey => subtree.has(JSON.parse(fieldKey)[0]);
  const before = captureCandidate(state);
  const fields = (state.flowTextTargets || []).filter(field => subtree.has(field.id));
  const scales = new Map(fields.map(field => [field.key, paintedScale(field.target)]));
  const previousDivisor = before.plan.factor[key] || 1;
  const projected = Object.keys(before.plan.truncate).some(owns);
  const viewport = state.slideElement.getBoundingClientRect().width / scope.CANVAS.renderWidth;
  const budget = () => slotBudgets(state).get(id) ?? Infinity;
  const sharedOnly = !state.groupingCompressionIds && !changed && !projected &&
    !baseline.externalPressure.some(p => subtree.has(p.id)) && !baseline.internalPressure.some(p => subtree.has(p.id));
  if (sharedOnly && !(baseline.overflowY > SAFE_EDGE_EPSILON && element.getBoundingClientRect().height / viewport > budget() + SAFE_EDGE_EPSILON)) return false;
  const geometry = state.flowGeometry?.get(id);
  const continuous = Number.isFinite(geometry?.width) && geometry.slotWidth > 0;
  const boundsRatio = () => {
    const box = element.getBoundingClientRect(), slot = record.shell.getBoundingClientRect();
    return Math.max(1, box.width > 0 && slot.width > 0 ? box.width / slot.width : 1,
      box.height / viewport / Math.max(SAFE_EDGE_EPSILON, budget()));
  };
  const round = value => Math.ceil((value - 1e-9) * 1000000) / 1000000;
  const start = continuous ? round(previousDivisor * boundsRatio())
    : Math.round(previousDivisor * 10 + 1) / 10;
  const maximum = Math.min(COMPRESSION_POLICY.maximumDivisor, ...fields.map(field =>
    previousDivisor * scales.get(field.key) * field.basePt / field.ladder.at(-1)));
  const pressure = p => (p.overflowX || 0) + (p.overflowY || 0) + Number(Boolean(p.blocked));
  const unrelated = new Map(baseline.internalPressure.filter(p => !subtree.has(p.id)).map(p => [p.key, pressure(p)]));
  let best = null, bestFits = false, bestProjection = Infinity, bestScore = baseline.overflowX + baseline.overflowY, completed = false;
  try {
    // Full original text is searched first; an existing projection is only a fallback.
    for (const preserveProjection of projected ? [false, true] : [false]) {
      // Reflow can reduce height after the logical width grows. A ratio from
      // the old line wrapping must not skip the entire legal search interval.
      let divisor = continuous ? Math.min(start, maximum) : start;
      for (let pass = 0; pass < 24 && divisor <= maximum + 1e-9; pass++) {
        if (continuous && pass === 23) divisor = maximum;
        restoreCandidate(state, before);
        state.flowCompression.factor[key] = divisor;
        if (!validNestedFactors(state.slide.blocks, state.flowCompression.factor)) break;
        const candidateScales = new Map(fields.map(field => [field.key, scales.get(field.key) * previousDivisor / divisor]));
        if (!compensateSurfaceTypography(fields, state.flowCompression, candidateScales, state.previewEnumTextFit)) break;
        if (!preserveProjection) for (const fieldKey of Object.keys(state.flowCompression.truncate).filter(owns)) delete state.flowCompression.truncate[fieldKey];
        yield () => measure('component', row);
        const result = report();
        const valid = !result.minFontViolations && !result.scaleRejections?.length && result.overlaps <= baseline.overlaps && !result.budgetConvergenceViolations;
        const internalFits = !result.internalPressure.some(p => subtree.has(p.id));
        const locallyFits = internalFits && element.getBoundingClientRect().height / viewport <= budget() + SAFE_EDGE_EPSILON &&
          !result.externalPressure.some(p => subtree.has(p.id) && p.overflowX > 0);
        const score = result.overflowX + result.overflowY;
        const projection = Object.keys(state.flowCompression.truncate).filter(owns).length;
        const noRegression = result.overflowX <= baseline.overflowX + SAFE_EDGE_EPSILON && result.overflowY <= baseline.overflowY + SAFE_EDGE_EPSILON &&
          result.internalPressure.filter(p => !subtree.has(p.id)).every(p => pressure(p) <= (unrelated.get(p.key) || 0) + SAFE_EDGE_EPSILON);
        const improves = score < bestScore - .01;
        const eligible = valid && internalFits && noRegression && (!baseline.fits || result.fits) && (result.fits || improves || (!sharedOnly && locallyFits));
        if (eligible && (!best || Number(result.fits) > Number(bestFits) || (result.fits === bestFits &&
          (projection < bestProjection || (projection === bestProjection && score < bestScore - .01))))) {
          best = captureCandidate(state); bestFits = result.fits; bestScore = score; bestProjection = projection;
        }
        if (valid && locallyFits) break;
        // The measured bound advances directly; semantic/line-wrap pressure gets
        // bounded intermediate probes rather than an unbounded geometric search.
        if (divisor >= maximum - 1e-9) break;
        const next = continuous ? round(Math.max(divisor * boundsRatio(), divisor + .05)) : Math.round(divisor * 10 + 1) / 10;
        divisor = continuous ? Math.min(maximum, next) : next;
      }
      if (best && !bestProjection) break;
    }
    restoreCandidate(state, best || before);
    yield () => measure(best ? 'component-commit' : 'component-revert', row);
    completed = true;
    return Boolean(best);
  } finally {
    if (!completed) restoreCandidate(state, before);
  }
}
