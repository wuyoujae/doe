import { flowRows, flowRowMetrics } from '../../../../../../doe-component/src/layout/flow/rows.js';
import { scope } from '../../runtime/context/index.js';
import { paintedSurface, imageSurfaceInsets } from '../../canvas/renderer/image-surface/index.js';
import { paintedScale } from './compression/targets.js';

/** Allocate spare height to native adapters without forcing Slot heights. */
export function flowHeightBudgets(state, naturalHeights = new Map()) {
  const records = new Map([...state.groupRecords, ...state.leafRecords].map(r => [r.node.id, r]));
  const budgets = new Map();
  const metrics = new Map();
  const viewport = state.slideElement?.getBoundingClientRect().width / scope.CANVAS?.renderWidth;
  const measuredHeight = element => viewport > 0 && element?.getBoundingClientRect
    ? element.getBoundingClientRect().height / viewport : element?.offsetHeight || 0;
  const gap = record => (record.gap || 0) * paintedScale(record.content || record.element);
  function metric(node) {
    if (metrics.has(node.id)) return metrics.get(node.id);
    const record = records.get(node.id);
    const inset = !node.children && record ? imageSurfaceInsets(record).y : 0;
    const scale = paintedScale(record && paintedSurface(record));
    let natural = measuredHeight(node.children ? record?.shell : record && paintedSurface(record) || record?.shell);
    const contract = record?.definition?.flowLayout;
    // A chart that yielded space must be able to grow back after text/reflow
    // releases it. Its already shortened DOM is not its natural height.
    if (contract?.reshapeHeight && naturalHeights.has(node.id)) natural = (naturalHeights.get(node.id) + inset) * scale;
    let minimum = contract?.reshapeHeight ? Math.min(natural, ((contract.minReshapeHeightPx || 0) + inset) * scale) : natural;
    let rows = [];
    if (node.children?.length && record) {
      const columns = record.resolvedColumns || 1;
      const childrenMetrics = node.children.map(metric);
      const geometry = flowRowMetrics(childrenMetrics.map(value => value.natural), columns, gap(record));
      const minimumGeometry = flowRowMetrics(childrenMetrics.map(value => value.minimum), columns, gap(record));
      natural = geometry.height;
      minimum = minimumGeometry.height;
      let offset = 0;
      rows = flowRows(node.children.length, columns).map((size, index) => {
        const children = node.children.slice(offset, offset + size); offset += size;
        return { children, natural: geometry.rows[index], minimum: minimumGeometry.rows[index] };
      });
    }
    const value = { natural, minimum, rows };
    metrics.set(node.id, value);
    return value;
  }
  function distribute(values, available) {
    const minimum = values.reduce((sum, value) => sum + value.minimum, 0);
    const flexible = values.reduce((sum, value) => sum + Math.max(0, value.natural - value.minimum), 0);
    const remaining = Math.max(0, available - minimum);
    return values.map(value => value.minimum + (flexible ? Math.min(1, remaining / flexible) * Math.max(0, value.natural - value.minimum) : 0));
  }
  function visit(node, available) {
    budgets.set(node.id, available);
    const record = records.get(node.id);
    if (!node.children?.length || !record) return;
    const { rows } = metric(node);
    const assigned = distribute(rows, Math.max(0, available - (rows.length - 1) * gap(record)));
    rows.forEach((row, index) => row.children.forEach(child => visit(child, assigned[index])));
  }
  const roots=state.flowTopRecords;
  const gaps=roots.reduce((n,r)=>n+(parseFloat(r.shell.style.marginBottom)||0)*paintedScale(r.shell),0);
  // Text keeps its measured height at this density. Only components declaring
  // reshape support share the remaining height, respecting their native minimum.
  const assigned = distribute(roots.map(r => metric(r.node)), state.flowSafeArea.content.height - gaps);
  roots.forEach((record, index) => visit(record.node, assigned[index]));
  return budgets;
}
