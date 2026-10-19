/** The order is shared; each component keeps its own geometry and text floor. */
export const STYLE_FIRST = Object.freeze({
  strategy: 'style-first',
  stages: Object.freeze(['reflow', 'geometry', 'typography', 'reject']),
  preserveContent: true,
});

export function collectionColumnOrder(count, maximum = 4) {
  const max = Math.min(count, maximum);
  return [3, 2, 1].filter(n => n <= max);
}

export function collectionColumns(width, requested, count, gap = 24) {
  // Three is the natural layout. Explicit fallback candidates can use narrower
  // cards; their complete text is measured before typography is reduced.
  const columns = Math.max(1, Math.min(count || 1, 4, Number(requested) || 3));
  for (let candidate = columns; candidate > 1; candidate -= 1) {
    const minimum = candidate === 3 ? 240 : 120;
    if ((width - gap * (candidate - 1)) / candidate >= minimum) return candidate;
  }
  return 1;
}
