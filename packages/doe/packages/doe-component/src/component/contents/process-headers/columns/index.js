/** Balanced rows, with a final incomplete row retaining the same cell width. */
export function ascendingColumnOrder(count, node) {
  const maximum = Math.max(1, Math.min(5, count));
  const props = node?.props || {};
  const manual = props.itemLayout === 'auto' ? 0 : props.columnPreference !== 'auto' && Number(props.columnPreference)
    || (props.itemLayout === 'stack' ? 1 : props.itemLayout === 'grid' && Number(props.itemColumns));
  if (manual) return [Math.max(1, Math.min(maximum, manual))];
  return (count % 2 ? [3, 2, 4, 1] : [2, 4, 3, 1]).filter(columns => columns <= maximum);
}
