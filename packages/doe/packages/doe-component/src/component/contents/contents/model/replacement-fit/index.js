/** Style conversion preserves selected copy without newly omitting its siblings. */
export function replacementFitIssue(report, componentId, previousPlan = {}) {
  const plan = report?.compressionPlan;
  const compatible = typeof plan?.version === 'string' && typeof plan?.algorithm === 'string'
    && plan.version === previousPlan?.version && plan.algorithm === previousPlan?.algorithm;
  const incomplete = Object.entries(plan?.truncate || {}).some(([key, value]) => {
    if (value !== 1) return false;
    try {
      if (JSON.parse(key)[0] === componentId) return true;
      return !compatible || !Object.hasOwn(previousPlan.truncate || {}, key) || previousPlan.truncate[key] !== 1;
    } catch { return true; }
  });
  if (report?.fits) return incomplete ? { key: 'errors.layoutIncomplete' } : null;
  if (report?.budgetConvergenceViolations) return { key: 'errors.layoutUnstable' };
  if (report?.minFontViolations) return { key: 'errors.layoutFontLimit' };
  const horizontal = report?.overflowX || 0, vertical = report?.overflowY || 0;
  const overflow = Math.max(0, horizontal, vertical);
  if (overflow) return { key: horizontal >= vertical ? 'errors.layoutWidth' : 'errors.layoutHeight',
    values: { amount: Math.ceil(overflow * .75 * 10) / 10 } };
  if (incomplete || report?.internalPressure?.length) return { key: 'errors.layoutIncomplete' };
  return { key: 'errors.layoutOverflow' };
}
