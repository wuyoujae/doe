import { measureDensityOnce } from '../../canvas/measurement/measure-density-once/index.js';
import { automaticItemColumnSequence } from '../automatic-item-column-sequence/index.js';
import { isEdgeSplitGroup } from '../is-edge-split-group/index.js';
import { isLayoutFeatureLocked } from '../is-layout-feature-locked/index.js';
import { groupColumns } from './apply.js';
import { flowHeightBudgets } from './height-budgets.js';
import { scope } from '../../runtime/context/index.js';
import { solveLocalFlowLayout } from './compression/solve.js';

/** Finite stages: reflow at authored columns, semantic compression, then structure. */
export function solveFlowLayout(state) {
  if (state.flowLayout.compression !== 'page-v1') return solveLocalFlowLayout(state);
  state.flowCompression = null;
  if (state.solverPerformance) state.solverPerformance.runs += 1;
  const densities = scope.DENSITIES.filter(d => d.id !== 'micro' || state.slide.layout.allowEmergency8Pt);
  const collections = state.leafRecords.filter(record => {
    const contract = record.definition.resolveItemCollection?.(record.node.props) || record.definition.itemCollection;
    return contract && !contract.fixedLayout
      && !isLayoutFeatureLocked(record.node, 'structure') && !isLayoutFeatureLocked(record.node, 'itemLayout');
  }).map(record => ({ id: record.node.id, columns: automaticItemColumnSequence(record.node, record.definition)[0] || 1 }));
  const groups = state.groupRecords.filter(record => !isEdgeSplitGroup(record.node)
    && record.node.layout?.region !== 'content').map(record => ({ id: record.node.id, columns: groupColumns(record.node),
      locked: isLayoutFeatureLocked(record.node, 'structure') || isLayoutFeatureLocked(record.node, 'columns') }));
  const maxColumns = Math.max(1, ...groups.filter(g => !g.locked).map(g => g.columns), ...collections.map(g => g.columns));
  const attempts = [];
  let best;
  function measure(density, reduction, timelineStage) {
    state.flowColumns = new Map(groups.map(g => [g.id, Math.max(1, g.columns - (g.locked ? 0 : reduction))]));
    state.autoItemColumns = new Map(collections.map(g => [g.id, Math.max(1, g.columns - reduction)]));
    state.spacingCompressionOverride = 0;
    state.timelineFallbackStage = timelineStage;
    state.localDensities = new Map();
    state.flowHeightBudgets = new Map();
    state.flowReshape = false;
    let result = measureDensityOnce(state, density);
    // Trade height for width through native component adaptation. Fixed margins/gaps
    // are subtracted before allocating height; the page is never scaled as a bitmap.
    if (!result.fits) {
      state.flowHeightBudgets = flowHeightBudgets(state);
      state.flowReshape = true;
      result = measureDensityOnce(state, density);
    }
    const attempt = { ...result, reduction, timelineStage,
      flowColumns: new Map(state.flowColumns), autoItemColumns: new Map(state.autoItemColumns),
      flowReshape: state.flowReshape, flowHeightBudgets: new Map(state.flowHeightBudgets),
      phase: reduction || timelineStage ? 'structure' : density === densities[0] ? 'reflow' : 'compression' };
    attempts.push(attempt);
    if (!best || attempt.fits || attempt.score < best.score) best = attempt;
    return attempt.fits;
  }
  outer: for (let reduction = 0; reduction < maxColumns; reduction += 1) {
    for (const density of densities) if (measure(density, reduction, 0)) break outer;
  }
  const hasTimeline = state.leafRecords.some(record => /^(timeline-|alternating)/.test(record.node.props?.presentation || ''));
  if (!best.fits && hasTimeline) {
    outer: for (const stage of [1, 2]) {
      for (const density of densities) if (measure(density, maxColumns - 1, stage)) break outer;
    }
  }
  state.flowColumns = best.flowColumns;
  state.autoItemColumns = best.autoItemColumns;
  state.flowHeightBudgets = best.flowHeightBudgets;
  state.flowReshape = best.flowReshape;
  state.timelineFallbackStage = best.timelineStage;
  const winner = { ...best, ...measureDensityOnce(state, scope.DENSITIES[best.densityIndex]) };
  const overflowLabel = winner.fits ? '' : '空间不足：重排、压缩及降列后仍无法完整容纳内容';
  Object.assign(state.slideElement.dataset, { overflow: String(!winner.fits), overflowLabel,
    density: winner.density, solverVersion: 'flow-v1', layoutAttemptCount: String(attempts.length),
    flowPhase: winner.phase });
  return { ...winner, overflowLabel, solverVersion: 'flow-v1', spacingCompression: 0,
    minimumFontPt: winner.minimumFontPx === null ? null : winner.minimumFontPx * 72 / 96,
    structuralFallbackSteps: winner.reduction, layoutFallbackSteps: winner.reduction,
    timelineFallbackStage: winner.timelineStage, structuralPlan: {}, localTypographyPlan: {},
    localTypographySteps: 0, compositions: [], canonicalization: [],
    collectionPlan: Object.fromEntries(winner.flowColumns),
    groups: state.groupRecords.map(g => ({ id: g.node.id, requestedColumns: g.requestedColumns,
      resolvedColumns: g.resolvedColumns, gap: g.gap, childCount: g.node.children.length })),
    itemCollections: collections.map(g => ({ id: g.id, resolvedColumns: winner.autoItemColumns.get(g.id) })),
    safeArea: state.flowSafeArea.content, attemptCount: attempts.length,
    attempts: attempts.map(({ density, fits, phase, reduction, overflowX, overflowY }) => ({ density, fits, phase, reduction, overflowX, overflowY })),
  };
}
