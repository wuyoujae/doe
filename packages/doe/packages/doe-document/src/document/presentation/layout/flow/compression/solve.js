import { cachedCompression } from './cache.js';
import { commitFlowPlan } from './commit.js';
import { finalizeSemanticWrapping } from '../../../canvas/renderer/finalize-semantic-wrapping/index.js';
import { measureCompressionPressure } from './pressure.js';
import { layoutDiagnostics, layoutOverflowLabel } from './diagnostics.js';
import { runSteps } from './steps.js';
import { measureDensityOnce } from '../../../canvas/measurement/measure-density-once/index.js';
import { adaptiveItemColumnSequence } from '../../automatic-item-column-sequence/index.js';
import { isLayoutFeatureLocked } from '../../is-layout-feature-locked/index.js';
import { isEdgeSplitGroup } from '../../is-edge-split-group/index.js';
import { applyFlowDensity, groupColumns } from '../apply.js';
import { itemTextPeers, continuousTextPeers, stepItemText } from './item-text.js';
import { fitContinuousTextSteps, setItemTextRatio } from './continuous.js';
import { scope } from '../../../runtime/context/index.js';
import { COMPRESSION_POLICY, normalizeCompression } from './policy.js';
import { compressionRows, paintedScale } from './targets.js';
import { restoreContinuousTextSteps, preserveHeadingHierarchy } from './restore.js';
import { compensateOrientationSteps } from './orientation.js';
import { compressionInputs, compressionCacheKey, inputChanges } from './inputs.js';
import { slotBudgets } from './pressure.js';
import { flowHeightBudgets } from '../height-budgets.js';
import { compensateColumnsSteps } from './adaptive-columns.js';
import { compensateTimelineSteps } from './timeline.js';
import { scalableFlowSurfaces, compensateSurfaceSteps } from './surface.js';
import { settleBudgetMeasurements } from './budgets.js';
import { captureCandidate, restoreCandidate } from './candidate.js';

export function solveLocalFlowLayout(state) { return runSteps(solveLocalFlowSteps(state)); }
export function* solveLocalFlowSteps(state) {
  const before = captureCandidate(state);
  let completed = false;
  try {
    const result = yield* solveLocalFlowCandidateSteps(state);
    completed = true;
    return result;
  } finally {
    if (!completed) {
      restoreCandidate(state, before);
      // Cancellation still restores the frame before cooperative opacity is
      // released. This is a single render, not a new solve or a saved plan.
      if (!state.disposed && state.layoutElement?.isConnected) {
        try { applyFlowDensity(state, scope.DENSITIES[0]); }
        catch (error) { state.flowRollbackError = String(error?.message || error); }
      }
    }
  }
}

function* solveLocalFlowCandidateSteps(state) {
  if (state.solverPerformance) state.solverPerformance.runs += 1;
  const density = scope.DENSITIES[0], attempts = [];
  state.pendingFlowPlan = null; state.orientationDecisions = []; state.timelineDecisions = []; state.columnDecisions = [];
  let saved = normalizeCompression(state.previewEnumTextFit ? null : state.slide.layout.compression);
  if (!state.previewEnumTextFit) saved.text = {};
  const collections = state.leafRecords.filter(record => {
    const contract = record.definition.resolveItemCollection?.(record.node.props) || record.definition.itemCollection;
    return contract && !contract.fixedLayout;
  });
  const candidates = new Map(collections.map(record => {
    return [record.node.id, adaptiveItemColumnSequence(record.node, record.definition)];
  }));
  state.flowColumns = new Map(state.groupRecords.map(record => [record.node.id, groupColumns(record.node)]));
  state.autoItemColumns = new Map([...candidates].map(([id, values]) => [id, values[0]]));
  state.spacingCompressionOverride = 0;
  state.timelineFallbackStage = 0;
  state.localDensities = new Map();
  state.flowHeightBudgets = new Map();
  state.flowNaturalHeights = null;
  state.flowContentBudgets = null;
  state.flowCompression = normalizeCompression(null);
  let result;
  function measure(phase, row = null) {
    result = settleBudgetMeasurements(state, () => measureDensityOnce(state, density),
      () => slotBudgets(state), () => flowHeightBudgets(state, state.flowNaturalHeights),
      spacing => measureCompressionPressure(state, density, spacing));
    attempts.push({ phase, fits: result.fits, overflowX: result.overflowX, overflowY: result.overflowY,
      internal: result.internalPressure.map(p => p.key), target: row?.units[0].id || null,
      budgetPasses: state.flowBudgetPasses, budgetStable: state.flowBudgetStable });
    return result.fits;
  }
  (yield () => measure('natural'));
  state.flowNaturalHeights = new Map(state.leafRecords.filter(r => r.definition.flowLayout?.reshapeHeight)
    .map(r => [r.node.id, r.element.offsetHeight]));
  state.flowContentBudgets = slotBudgets(state);
  const inputs = compressionInputs(state);
  const cacheKey = compressionCacheKey(state, inputs);
  const reusable = !state.previewEnumTextFit && !state.flowPreview && !state.flowChanged;
  const cached = reusable && !saved.inputs ? cachedCompression(cacheKey) : null;
  if (cached) saved = cached;
  const changes = saved.inputs ? inputChanges(saved.inputs, inputs) : [];
  if (!state.flowChanges?.length && changes.length) state.flowChanges = changes;
  // A derived plan is evidence of previous input, never a structural constraint.
  // The deterministic natural start keeps cold/reopened/edited solves identical.
  state.flowCompression = normalizeCompression(null);
  const rows = compressionRows(state);
  const scalable = scalableFlowSurfaces(state);
  const schemaOrder = [...rows.filter(row => !row.units[0].record.node.children), ...rows.filter(row => row.units[0].record.node.children)];
  const order = schemaOrder;
  const remember = row => {
    const key = row.units[0].key;
    state.flowCompression.order = [...state.flowCompression.order.filter(value => value !== key), key];
  };
  // Collection copy shares one ratio while keeping the title/body hierarchy.
  // Separate components and native chart labels remain independent.
  function* solveContent(onlyId = null, allowTruncate = true) {
    const fits = () => !result.internalPressure.some(p => onlyId === null || p.id === onlyId);
    if (fits()) return true;
    // Growable collections settle before independent headings: their initial
    // height must not force an unrelated heading down a font step.
    const contentOrder = [...order].sort((a, b) => Number(Boolean(b.units[0].record.definition?.itemCollection)) - Number(Boolean(a.units[0].record.definition?.itemCollection)));
    // Font changes across peers must finish before any text is projected away.
    // A later peer can release enough height to preserve an earlier full item.
    for (const truncate of onlyId === null && allowTruncate ? [false, true] : [false]) for (const row of contentOrder) {
      const { id, record } = row.units[0];
      if (record.node.children || (onlyId !== null && id !== onlyId)) continue;
      state.flowContentBudgets = slotBudgets(state);
      (yield () => measure('content-capacity', row));
      const pressureKeys = () => result.internalPressure.filter(p => p.id === id).map(p => p.key);
      const orderedKeys = () => [...new Set(pressureKeys())];
      const exhausted = new Set();
      while (pressureKeys().length) {
        const key = orderedKeys().find(key => !exhausted.has(key));
        if (!key) break;
        while (pressureKeys().includes(key)) {
          const field = state.flowTextTargets.find(field => field.key === key);
          if (!field || field.typographyLocked || isLayoutFeatureLocked(record.node, 'typography')) { exhausted.add(key); break; }
          const peers = (state.previewEnumTextFit ? itemTextPeers : continuousTextPeers)(state.flowTextTargets, field);
          if (truncate) {
            state.flowCompression.truncate[key] = 1;
            (yield () => measure('content-truncate', row)); remember(row);
            // A sibling may still occupy the entire box. Solve its content
            // before deciding whether this item is impossible to fit.
            if (pressureKeys().includes(key)) exhausted.add(key);
            break;
          }
          if (!state.previewEnumTextFit) {
            const keys = new Set(peers.map(peer => peer.key));
            yield* fitContinuousTextSteps(peers, state.flowCompression.textRatio[key] ?? 1, ratio => {
              setItemTextRatio(state.flowCompression, peers, ratio);
              measure('content-continuous', row);
              return !result.internalPressure.some(pressure => keys.has(pressure.key));
            });
            remember(row);
            if (pressureKeys().some(key => keys.has(key))) for (const key of keys) exhausted.add(key);
            break;
          }
          if (!stepItemText(state.flowCompression, peers, 1)) { exhausted.add(key); break; }
          (yield () => measure('content', row)); remember(row);
        }
      }
    }
    return fits();
  }
  const externalOrder = state.groupingCompressionIds
    ? state.groupingCompressionIds.flatMap(id => order.filter(row => row.units[0].id === id)) : order;
  function* completePage() {
    state.flowCompression = normalizeCompression(null);
    state.flowHeightBudgets = new Map(); state.flowContentBudgets = null;
    state.orientationDecisions = []; state.timelineDecisions = [];
    for (const [id, values] of candidates) {
      if (state.autoItemColumns.get(id) !== values[0]) state.flowCompression.columns[id] = state.autoItemColumns.get(id);
    }
    yield () => measure('candidate-natural');
    state.flowNaturalPressure = result;
    for (const row of order) {
      if (yield* compensateTimelineSteps(state, row, measure, () => result)) remember(row);
      if (yield* compensateOrientationSteps(state, row, measure, () => result, candidates, solveContent)) remember(row);
    }
    if (!result.fits && !state.previewEnumTextFit) {
      // Establish a common feasible typography baseline. Fitting a collection
      // against an uncompressed display title first would starve its body text.
      const visited = new Set();
      for (const row of order) {
        const { id, record } = row.units[0];
        if (record.node.children || isLayoutFeatureLocked(record.node, 'typography')) continue;
        for (const field of state.flowTextTargets.filter(field => field.id === id && !field.typographyLocked && !field.constraintOnly && field.path[0] !== '$label')) {
          if (visited.has(field.key)) continue;
          const peers = continuousTextPeers(state.flowTextTargets, field);
          peers.forEach(peer => visited.add(peer.key));
          setItemTextRatio(state.flowCompression, peers, 0);
        }
      }
      preserveHeadingHierarchy(state);
      yield () => measure('content-joint-floor');
    }
    if (!result.fits) yield* solveContent(null, false);
    // Fixed surfaces must try complete text and visible font floors together.
    // Their own internal pressure is a reason to try, not to skip, this step.
    for (const row of externalOrder) {
      if (result.fits) break;
      // Column decisions belong to complete candidates, never a late scaler.
      if (yield* compensateSurfaceSteps(state, row, measure, () => result, { allowed: scalable, columns: [] })) remember(row);
    }
    if (!result.fits) {
      const beforeProjection = JSON.stringify(state.flowCompression.truncate);
      yield* solveContent();
      // Existing projection remains a last resort for normal editing. Its new
      // painted size must get the same proportional fit as complete content.
      if (!result.fits && JSON.stringify(state.flowCompression.truncate) !== beforeProjection) {
        for (const row of externalOrder) {
          if (result.fits) break;
          if (yield* compensateSurfaceSteps(state, row, measure, () => result, { allowed: scalable, columns: [] })) remember(row);
        }
      }
    }
    if (!state.previewEnumTextFit && result.fits) yield* restoreContinuousTextSteps(state, order, measure, () => result);
    // Projection can change painted height. Acceptance uses its fresh budgets too.
    yield () => {
      finalizeSemanticWrapping(state);
      state.flowContentBudgets = slotBudgets(state);
      result = measureCompressionPressure(state, density, result.spacing);
      if (!state.flowBudgetStable) result = { ...result, fits: false, budgetConvergenceViolations: 1 };
    };
  }
  yield* completePage();
  const search = { preferences: new Map([...candidates].map(([id, values]) => [id, values[0]])),
    visited: new Set([JSON.stringify([...state.autoItemColumns])]), trials: 0, limit: 48, exhausted: false, passes: 0 };
  // Coordinate search revisits earlier collections after later ones release
  // space; two sweeps bound cost without a Cartesian product of all grids.
  for (let pass = 0; pass < 2 && !search.exhausted; pass++) {
    let changed = false; search.passes++;
    for (const row of order) {
      if (yield* compensateColumnsSteps(state, row, candidates.get(row.units[0].id), measure, () => result, completePage, search)) {
        remember(row); changed = true;
      }
    }
    if (!changed) break;
  }
  const overflowLabel = layoutOverflowLabel(result);
  if (result.fits && !state.previewEnumTextFit) {
    // Already accepted logical text boxes remain available when items are
    // inserted around them. Structural growth must not become text pressure.
    const viewport = state.slideElement.getBoundingClientRect().width / scope.CANVAS.renderWidth;
    state.flowCompression.height = Object.fromEntries(state.flowTextTargets.map(field => [field.key,
      Math.ceil(field.target.getBoundingClientRect().height / viewport / paintedScale(field.target))]));
    state.flowCompression.inputs = inputs;
    state.pendingFlowPlan = { plan: normalizeCompression(state.flowCompression), cacheKey };
    if (!state.deferFlowCommit) commitFlowPlan(state, result);
  }
  const phase = Object.keys(state.flowCompression.factor).length ? 'component' : Object.keys(state.flowCompression.text).length || Object.keys(state.flowCompression.textRatio).length ? 'content' : Object.keys(state.flowCompression.orientation).length ? 'orientation' : Object.keys(state.flowCompression.timeline).length ? 'timeline' : Object.keys(state.flowCompression.columns).length ? 'columns' : 'reflow';
  Object.assign(state.slideElement.dataset, { overflow: String(!result.fits), overflowLabel, density: density.id,
    solverVersion: 'flow-local-v4', layoutAttemptCount: String(attempts.length), flowPhase: phase });
  return { ...result, overflowLabel, diagnostics: layoutDiagnostics(state, result, 'solve'), orientationDecisions: state.orientationDecisions, timelineDecisions: state.timelineDecisions,
    columnDecisions: state.columnDecisions, columnSearch: { trials: search.trials, passes: search.passes, limit: search.limit, exhausted: search.exhausted }, solverVersion: 'flow-local-v4', spacingCompression: 0,
    compressionCacheHit: false, compressionCacheValidated: Boolean(cached), textFitStrategy: state.previewEnumTextFit ? 'enum' : 'continuous', continuousTextRatios: { ...state.flowCompression.textRatio },
    minimumFontPt: result.minimumFontPx === null ? null : result.minimumFontPx * 72 / 96,
    structuralFallbackSteps: Object.keys(state.flowCompression.columns).length, layoutFallbackSteps: 0, timelineFallbackStage: 0,
    structuralPlan: {}, localTypographyPlan: { ...(state.previewEnumTextFit ? state.flowCompression.text : state.flowCompression.textRatio) }, localTypographySteps: state.previewEnumTextFit ? Object.values(state.flowCompression.text).reduce((sum, n) => sum + n, 0) : Object.keys(state.flowCompression.textRatio).length,
    compressionPlan: normalizeCompression(state.flowCompression), compressionPolicy: COMPRESSION_POLICY, compressionPhase: phase,
    compositions: [], canonicalization: [], collectionPlan: Object.fromEntries(state.flowColumns),
    groups: state.groupRecords.filter(record => !isEdgeSplitGroup(record.node)).map(record => ({ id: record.node.id, requestedColumns: record.requestedColumns, resolvedColumns: record.resolvedColumns, gap: record.gap, childCount: record.node.children.length })),
    itemCollections: collections.map(record => ({ id: record.node.id, resolvedColumns: state.autoItemColumns.get(record.node.id) })),
    safeArea: state.flowSafeArea.content, attemptCount: attempts.length, attempts };
}
