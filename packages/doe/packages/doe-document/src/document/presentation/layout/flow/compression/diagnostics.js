/** Diagnostics use slide points; author text and credentials are never included. */
export function layoutDiagnostics(state, report, stage) {
  const pt = n => Math.round(n * .75 * 1000) / 1000;
  const nodes = new Map(state.leafRecords.map(r => [r.node.id, r.node]));
  return [
    ...(report.budgetConvergenceViolations ? [{ code: 'layout-budget-unstable', stage,
      passes: state.flowBudgetPasses || 0 }] : []),
    ...report.internalPressure.map(p => ({ code: p.blocked ? 'unbreakable-content' : p.overflowX ? 'text-width' : 'text-height',
      stage, componentId: p.id, path: p.path, capacityPt: pt(p.availableHeight), overflowXPt: pt(p.overflowX), overflowYPt: pt(p.overflowY), lock: nodes.get(p.id)?.layout?.lock || null })),
    ...report.externalPressure.map(p => ({ code: 'component-bounds', stage, componentId: p.id,
      overflowXPt: pt(p.overflowX), overflowYPt: pt(p.overflowY) })),
    ...(report.fontPressure || []).map(p => ({ code: 'minimum-visible-font', stage, componentId: p.id,
      path: p.path, minimumPt: p.minimumPt, actualPt: Math.round(p.actualPt * 1000) / 1000 })),
    ...(report.scaleRejections || []).map(p => ({ code: 'fluid-surface-scale', stage, ...p })),
    ...(report.overlaps ? [{ code: 'sibling-overlap', stage, count: report.overlaps }] : []),
  ];
}

/** A bounded search that did not settle is not proof of insufficient capacity. */
export function layoutOverflowLabel(report) {
  if (report.fits) return '';
  if (report.budgetConvergenceViolations) return '排版空间分配尚未稳定：本次结果未被接受，请重新排版';
  if (report.minFontViolations) return '内容空间不足：继续缩放会低于可读字号，拒绝本次修改';
  if (report.internalPressure.length) return '内容空间不足：最小文字与省略号仍无法容纳，拒绝本次修改';
  return '组件空间不足：调整列数、弹性高度和可读字号后仍无法容纳，拒绝本次修改';
}
