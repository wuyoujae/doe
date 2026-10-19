const px = value => parseFloat(value) || 0;

/** Short rows keep their natural height; remaining capacity belongs to long rows. */
export function rowCapacities(heights, available) {
  let remaining = Math.max(0, available), count = heights.length;
  const result = [];
  for (const { height, index } of heights.map((height, index) => ({ height, index })).sort((a, b) => a.height - b.height)) {
    const capacity = Math.min(height, remaining / count);
    result[index] = capacity;
    remaining -= capacity;
    count--;
  }
  return result;
}

/** Components describe their geometry; the solver never guesses a card family. */
export function contentGridCapacities(record, budget, scale) {
  const contract = record.flowContract?.contentGrid;
  const grid = contract && record.element.querySelector(contract.grid);
  const capacities = new Map();
  if (!grid) return capacities;
  const rows = [];
  for (const item of grid.querySelectorAll(contract.item)) {
    const surface = item.matches(contract.surface) ? item : item.querySelector(contract.surface);
    if (!surface) continue;
    const box = item.getBoundingClientRect();
    let row = rows.find(row => Math.abs(row.top - box.top / scale) < 1);
    if (!row) { row = { top: box.top / scale, height: 0, items: [] }; rows.push(row); }
    row.height = Math.max(row.height, box.height / scale);
    row.items.push({ surface, chrome: Math.max(0, (box.height - surface.getBoundingClientRect().height) / scale) });
  }
  const gridHeight = grid.getBoundingClientRect().height / scale;
  const head = Math.max(0, record.element.getBoundingClientRect().height / scale - gridHeight);
  const gaps = Math.max(0, gridHeight - rows.reduce((sum, row) => sum + row.height, 0));
  const heights = rowCapacities(rows.map(row => row.height), budget - head - gaps);
  rows.forEach((row, index) => row.items.forEach(({ surface, chrome }) => {
    const style = getComputedStyle(surface);
    const padding = px(style.paddingTop) + px(style.paddingBottom) + px(style.borderTopWidth) + px(style.borderBottomWidth);
    const minimum = px(style.minHeight) + (style.boxSizing === 'border-box' ? 0 : padding);
    capacities.set(surface, Math.max(minimum, heights[index] - chrome));
  }));
  return capacities;
}
