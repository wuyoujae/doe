import { slotBudgets, SAFE_EDGE_EPSILON } from './pressure.js';
import { scope } from '../../../runtime/context/index.js';
import { isLayoutFeatureLocked } from '../../is-layout-feature-locked/index.js';
import { captureCandidate, restoreCandidate, candidateQuality, betterCandidate } from './candidate.js';

/** Only automatic tracks enter this search; every trial completes the whole page. */
export function* compensateColumnsSteps(state, row, values, measure, report, completePage, search) {
  const { id, record } = row.units[0];
  if (!values?.length || values.length === 1 || record.flowContract?.orientationFallback
    || isLayoutFeatureLocked(record.node, 'structure') || isLayoutFeatureLocked(record.node, 'itemLayout')) return false;
  const before = captureCandidate(state), previous = state.autoItemColumns.get(id);
  const geometry = state.flowGeometry.get(id);
  const width = geometry.contentSlotWidth ?? geometry.slotWidth;
  const gap = parseFloat(getComputedStyle(record.element).getPropertyValue('--item-cards-gap')) || 24;
  const comfortableWidth = record.definition.columnMinWidth || 0;
  const trackWidth = columns => (width - gap * (columns - 1)) / columns;
  const viewport = state.slideElement.getBoundingClientRect().width / scope.CANVAS.renderWidth;
  const heightPressure = () => record.element.getBoundingClientRect().height / viewport > (slotBudgets(state).get(id) ?? Infinity) + SAFE_EDGE_EPSILON
    || report().internalPressure.some(p => p.overflowY > SAFE_EDGE_EPSILON)
    || report().overflowY > SAFE_EDGE_EPSILON || state.flowNaturalPressure?.overflowY > SAFE_EDGE_EPSILON;
  const compressed = Object.keys(state.flowCompression.textRatio).length || Object.keys(state.flowCompression.text).length
    || Object.keys(state.flowCompression.truncate).length || Object.keys(state.flowCompression.factor).length;
  const narrow = trackWidth(previous) < comfortableWidth - SAFE_EDGE_EPSILON;
  if (report().fits && !compressed && !narrow) return false;
  const fields = (state.flowTextTargets || []).filter(field => field.id === id && field.basePt > 0 && !field.constraintOnly);
  const widthRatio = !isLayoutFeatureLocked(record.node, 'typography') && record.flowContract?.surfaceScale === 'reflow' && fields.length
    ? Math.min(1, Math.max(...fields.map(field => field.ladder.at(-1) / field.basePt))) : 1;
  const comfortable = values.filter(columns => trackWidth(columns) >= comfortableWidth - SAFE_EDGE_EPSILON);
  const narrower = values.filter(columns => !comfortable.includes(columns)
    && trackWidth(columns) >= comfortableWidth * widthRatio - SAFE_EDGE_EPSILON);
  let needsHeightRelief = heightPressure();
  const preferences = search.preferences;
  let best = { snapshot: before, quality: candidateQuality(state, report(), preferences), columns: previous };
  const directional = new Set((state.leafRecords || []).filter(record => record.flowContract?.orientationFallback).map(record => record.node.id));
  const fixedChanges = [...preferences].filter(([other, preferred]) => other !== id && !directional.has(other)
    && before.maps.autoItemColumns.get(other) !== preferred).length;
  const trials = [];
  let completed = false;
  try {
    for (const columns of [...comfortable, ...narrower]) {
      if (!comfortable.includes(columns) && !needsHeightRelief) continue;
      const vector = new Map(before.maps.autoItemColumns); vector.set(id, columns);
      const signature = JSON.stringify([...vector]);
      if (search.visited.has(signature)) continue;
      if (search.trials >= search.limit) { search.exhausted = true; break; }
      search.visited.add(signature); search.trials++;
      restoreCandidate(state, before);
      state.autoItemColumns.set(id, columns);
      if (columns === values[0]) delete state.flowCompression.columns[id];
      else state.flowCompression.columns[id] = columns;
      yield* completePage();
      needsHeightRelief ||= heightPressure();
      const quality = candidateQuality(state, report(), preferences);
      trials.push({ columns, fits: report().fits, quality });
      if (betterCandidate(quality, best.quality)) best = { snapshot: captureCandidate(state), quality, columns };
      const preferred = new Map(before.maps.autoItemColumns); preferred.set(id, values[0]);
      const preferredTested = search.visited.has(JSON.stringify([...preferred])) || !comfortable.includes(values[0]);
      // No fitting candidate can exceed full source at natural typography with
      // comfortable tracks. Once its better structural tie has been tested,
      // all remaining alternatives are bounded above by the current winner.
      if (preferredTested && isColumnQualityUpperBound(best.quality, fixedChanges + Number(best.columns !== values[0]))
        && !Object.keys(best.snapshot.plan.factor).length) break;
    }
    restoreCandidate(state, best.snapshot);
    yield () => measure('columns-selected', row);
    completed = true;
  } finally {
    // Closing a cooperative iterator must not leave a trial plan to be saved.
    if (!completed) restoreCandidate(state, before);
  }
  state.columnDecisions?.push({ componentId: id, previous, chosen: best.columns, candidates: trials });
  return best.columns !== previous;
}

export function isColumnQualityUpperBound(quality, minimumChanges) {
  return quality[0] === 1 && quality.slice(1, 4).every(value => value === 0)
    && quality.slice(4, 8).every(value => value >= 1 - 1e-6)
    && quality[8] === 0 && quality[9] === -minimumChanges;
}
