import { normalizeCompression } from './policy.js';
import { slotBudgets, SAFE_EDGE_EPSILON } from './pressure.js';
import { scope } from '../../../runtime/context/index.js';
import { paintedSurface } from '../../../canvas/renderer/image-surface/index.js';
import { isLayoutFeatureLocked } from '../../is-layout-feature-locked/index.js';

const presentations = new Set(['timeline-numbered', 'timeline-dots', 'timeline-dot-cards', 'alternating']);
export const isCompactTimeline = node => node?.type === 'contents' && presentations.has(node.props?.presentation);
export const timelineLocked = node => isLayoutFeatureLocked(node, 'structure') || isLayoutFeatureLocked(node, 'itemLayout');

function noWorse(candidate, baseline) {
  if (baseline.fits && !candidate.fits) return false;
  for (const key of ['overflowX', 'overflowY', 'overlaps', 'minFontViolations', 'compressionFitViolations']) {
    if ((candidate[key] || 0) > (baseline[key] || 0) + SAFE_EDGE_EPSILON) return false;
  }
  if ((candidate.scaleRejections?.length || 0) > (baseline.scaleRejections?.length || 0)) return false;
  return (candidate.internalPressure || []).every(pressure => {
    const previous = baseline.internalPressure?.find(p => p.key === pressure.key);
    return previous && (!pressure.blocked || previous.blocked)
      && (pressure.overflowX || 0) <= (previous.overflowX || 0) + SAFE_EDGE_EPSILON
      && (pressure.overflowY || 0) <= (previous.overflowY || 0) + SAFE_EDGE_EPSILON;
  });
}

/** Only this timeline changes shape; source props and other timelines stay intact. */
export function* compensateTimelineSteps(state, row, measure, report) {
  const { id, key, record } = row.units[0], node = record.node;
  if (!isCompactTimeline(node) || timelineLocked(node) || node.props.items.length < 2) return false;
  const saved = normalizeCompression(state.flowCompression), baseline = report();
  const viewport = state.slideElement.getBoundingClientRect().width / scope.CANVAS.renderWidth;
  const height = () => paintedSurface(record).getBoundingClientRect().height / viewport;
  const capacity = () => slotBudgets(state).get(id) ?? Infinity;
  const localPressure = () => height() > capacity() + SAFE_EDGE_EPSILON
    || report().internalPressure?.some(p => p.id === id && p.overflowY > SAFE_EDGE_EPSILON);
  const previousStage = saved.timeline[id] || 0;
  if (!previousStage && !localPressure()) return false;
  let chosen = saved, chosenStage = previousStage, bestScore = baseline.score ?? Infinity;
  const trials = [];
  // Start with the author's shape when restoring a saved compact plan. Each
  // candidate uses the same original typography rather than inheriting a probe.
  const stages = [...(previousStage ? [0] : []), ...(node.props.staggered !== false ? [1] : []), ...(node.props.connectors !== false ? [2] : [])];
  for (const stage of stages) {
    state.flowCompression = normalizeCompression(saved);
    if (stage) state.flowCompression.timeline[id] = stage;
    else delete state.flowCompression.timeline[id];
    if (!isLayoutFeatureLocked(node, 'typography')) {
      for (const kind of ['text', 'textRatio', 'truncate', 'height']) for (const field of Object.keys(state.flowCompression[kind])) {
        if (JSON.parse(field)[0] === id) delete state.flowCompression[kind][field];
      }
    }
    delete state.flowCompression.factor[key];
    yield () => measure('timeline-natural', row);
    const result = report(), localFits = !localPressure(), legal = noWorse(result, baseline);
    const score = result.score ?? (result.overflowX || 0) + (result.overflowY || 0);
    trials.push({ stage, fits: result.fits, localFits, legal, height: height(), capacity: capacity() });
    if (legal && (result.fits || localFits || score < bestScore - SAFE_EDGE_EPSILON)) {
      chosen = normalizeCompression(state.flowCompression); chosenStage = stage; bestScore = score;
      if (result.fits || localFits) break;
    }
  }
  state.flowCompression = chosen;
  yield () => measure('timeline-commit', row);
  state.timelineDecisions?.push({ componentId: id, previousStage, chosenStage, candidates: trials });
  return JSON.stringify(saved) !== JSON.stringify(chosen);
}
