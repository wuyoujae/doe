import { runSteps } from './steps.js';
import { paintedScale } from './targets.js';
import { scope } from '../../../runtime/context/index.js';
import { slotBudgets, SAFE_EDGE_EPSILON } from './pressure.js';
import { normalizeCompression } from './policy.js';
import { isLayoutFeatureLocked } from '../../is-layout-feature-locked/index.js';
import { paintedSurface } from '../../../canvas/renderer/image-surface/index.js';
import { requestedItemColumns } from '../../automatic-item-column-sequence/index.js';

function clearContent(plan, id) {
  for (const kind of ['text', 'textRatio', 'truncate', 'height']) for (const key of Object.keys(plan[kind])) {
    if (JSON.parse(key)[0] === id) delete plan[kind][key];
  }
}
const locked = node => isLayoutFeatureLocked(node, 'structure') || isLayoutFeatureLocked(node, 'itemLayout');

/** Compare both directions at natural size before typography or component scaling. */
export function compensateOrientation(...args) { return runSteps(compensateOrientationSteps(...args)); }
export function* compensateOrientationSteps(state, row, measure, report, candidates, fitContent) {
  const { id, key, record } = row.units[0];
  if (!record.flowContract?.orientationFallback || locked(record.node)) return false;
  const saved = normalizeCompression(state.flowCompression), previous = state.autoItemColumns.get(id);
  const columns = candidates.get(id)?.[0] || 1;
  const collection = record.definition.resolveItemCollection?.(record.node.props) || record.definition.itemCollection || {};
  const requested = requestedItemColumns(record.node, collection);
  const hardColumns = Number.isInteger(requested) && candidates.get(id)?.includes(requested);
  const authored = record.node.props.orientation === 'vertical' ? 'vertical' : 'horizontal';
  const budget = () => slotBudgets(state).get(id) ?? state.flowContentBudgets.get(id);
  const gap = parseFloat(getComputedStyle(record.element).getPropertyValue('--item-cards-gap')) || 24;
  const minimum = record.definition.columnMinWidth || 240;
  const trials = [];
  const height = () => paintedSurface(record).getBoundingClientRect().height / (state.slideElement.getBoundingClientRect().width / scope.CANVAS.renderWidth) / paintedScale(record.element);
  // Direction and column count form one layout candidate. Directional cards are
  // excluded from the separate column search, so none of their legal counts
  // may be dropped here (for example four steps fitting on a single row).
  const layouts = [authored, authored === 'horizontal' ? 'vertical' : 'horizontal'].flatMap(direction =>
    (direction === 'vertical' ? (hardColumns && requested !== 1 ? [] : [1]) : candidates.get(id) || [1]).map(count => ({ direction, count })));
  for (const { direction, count } of layouts) {
    state.flowCompression = normalizeCompression(saved);
    clearContent(state.flowCompression, id);
    delete state.flowCompression.factor[key];
    if (direction === authored) delete state.flowCompression.orientation[id];
    else state.flowCompression.orientation[id] = direction;
    state.autoItemColumns.set(id, count);
    if (count === columns) delete state.flowCompression.columns[id];
    else state.flowCompression.columns[id] = count;
    yield () => measure('orientation-natural', row);
    const geometry = state.flowGeometry.get(id), result = report();
    const requiredWidth = minimum * count + gap * (count - 1) + (geometry.slotWidth - (geometry.contentSlotWidth ?? geometry.slotWidth));
    const pressure = result.internalPressure.filter(p => p.id === id);
    const overflowX = result.externalPressure.filter(p => p.id === id).some(p => p.overflowX > 0);
    const fits = geometry.slotWidth + SAFE_EDGE_EPSILON >= requiredWidth && height() <= budget() + SAFE_EDGE_EPSILON
      && !pressure.length && !overflowX;
    const score = Math.max(requiredWidth / Math.max(1, geometry.slotWidth), geometry.height / Math.max(1, budget()),
      1 + pressure.reduce((sum, p) => sum + p.overflowY + p.overflowX + Number(p.blocked), 0) / Math.max(1, geometry.height));
    trials.push({ direction, requiredWidth, fits, score, columns: count, plan: normalizeCompression(state.flowCompression) });
    // A full-size horizontal fit wins; a vertical fit must still try horizontal.
    if (fits && direction === 'horizontal') break;
  }
  let chosen = trials.find(trial => trial.fits && trial.direction === 'horizontal') || trials.find(trial => trial.fits);
  if (!chosen) {
    // Geometry alone cannot predict the best readable result. Evaluate each
    // legal direction with the existing shared text fitter, without truncating.
    for (const trial of trials) {
      state.flowCompression = normalizeCompression(trial.plan);
      state.autoItemColumns.set(id, trial.columns);
      yield () => measure('orientation-text-probe', row);
      trial.contentFits = yield* fitContent(id);
      const divisor = Math.max(1, height() / Math.max(1, budget()), trial.requiredWidth / Math.max(1, state.flowGeometry.get(id).slotWidth));
      const ratios = state.flowTextTargets.filter(f => f.id === id && f.path[0] !== '$label').map(f => state.flowCompression.textRatio[f.key] ?? 1);
      trial.readability = Math.min(1, ...ratios) / divisor;
      trial.legal = trial.contentFits && divisor <= 3;
      trial.plan = normalizeCompression(state.flowCompression);
    }
    chosen = trials.reduce((a, b) => Number(b.legal) > Number(a.legal) || (b.legal === a.legal && b.readability > a.readability + .0001) ? b : a);
  }
  state.orientationDecisions?.push({ componentId: id, authored, chosen: chosen.direction,
    widthPt: state.flowGeometry.get(id).slotWidth * .75, heightPt: budget() * .75,
    columns: chosen.columns,
    candidates: trials.map(({ direction, columns, requiredWidth, fits, contentFits, readability }) => ({ direction, columns, requiredWidthPt: requiredWidth * .75, fits, contentFits, readability })) });
  state.flowCompression = chosen.plan;
  state.autoItemColumns.set(id, chosen.columns);
  yield () => measure('orientation-commit', row);
  return previous !== chosen.columns || JSON.stringify(saved) !== JSON.stringify(chosen.plan);
}
