/** Equal-width collections keep larger rows first and center incomplete rows. */
export function balancedRows(count, capacity) {
  if (!count) return [];
  const rows = Math.ceil(count / Math.max(1, Math.floor(capacity)));
  const size = Math.floor(count / rows), extra = count % rows;
  return Array.from({ length: rows }, (_, index) => size + Number(index < extra));
}
