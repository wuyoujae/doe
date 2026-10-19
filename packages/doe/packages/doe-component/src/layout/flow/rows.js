/** Every row divides its own available width. No phantom cells on the last row. */
export function flowRows(count, columns) {
  const size = Math.max(1, Math.floor(columns) || 1);
  return Array.from({ length: Math.ceil(count / size) }, (_, i) => Math.min(size, count - i * size));
}

export function flowGrid(count, columns) {
  const rows = flowRows(count, columns);
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const tracks = rows.reduce((n, size) => n * size / gcd(n, size), 1);
  return { rows, tracks, spans: rows.flatMap(size => Array(size).fill(tracks / size)) };
}

export function flowRowMetrics(heights, columns, gap) {
  let offset = 0;
  const rows = flowRows(heights.length, columns).map(size => {
    const height = Math.max(0, ...heights.slice(offset, offset + size));
    offset += size;
    return height;
  });
  return { rows, height: rows.reduce((a, b) => a + b, 0) + Math.max(0, rows.length - 1) * gap };
}
