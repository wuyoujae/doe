const contains = (box, x, y) => x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
const distance = (value, low, high) => Math.max(low - value, 0, value - high);

function plotBounds(host, type) {
  const selectors = {
    'grouped-bar-chart': '.ppt-grouped-bar-chart__field',
    'line-chart': '.ppt-line-chart__field',
    'stacked-bar-chart': '.ppt-stacked-bar-chart__grid-line',
    'waterfall-chart': '.ppt-waterfall-chart__grid-line',
    'risk-matrix': '.ppt-risk-matrix__plot-border',
    'radar-chart': '.ppt-business-chart__radar-grid',
  };
  const boxes = [...host.querySelectorAll(selectors[type] || ':not(*)')].map(node => node.getBoundingClientRect());
  if (!boxes.length) return null;
  return {left: Math.min(...boxes.map(b => b.left)), right: Math.max(...boxes.map(b => b.right)), top: Math.min(...boxes.map(b => b.top)), bottom: Math.max(...boxes.map(b => b.bottom))};
}

function ringTarget(host, targets, config, x, y) {
  const svg = host.querySelector('[data-chart-hit-ring]'), matrix = svg?.getScreenCTM();
  if (!matrix) return null;
  const [cx, cy, inner, outer, start] = JSON.parse(svg.dataset.chartHitRing);
  const point = svg.createSVGPoint(); point.x = x; point.y = y;
  const local = point.matrixTransform(matrix.inverse()), radius = Math.hypot(local.x - cx, local.y - cy);
  if (radius < inner || radius > outer) return null;
  const angle = ((Math.atan2(local.y - cy, local.x - cx) * 180 / Math.PI - start) % 360 + 360) % 360;
  const values = config.content.items.map(item => Math.max(0, Number(item.value) || 0));
  const total = values.reduce((sum, value) => sum + value, 0);
  let end = 0;
  return targets.find((target, index) => {end += values[index] / total * 360; return values[index] > 0 && angle < end;}) || null;
}

// Hit regions are computed in screen coordinates, so the same partitions work
// in an iframe, a scaled slide and fullscreen without invisible overlay nodes.
export function chartTargetAt(host, type, targets, config, x, y) {
  if (type === 'donut-chart') return ringTarget(host, targets, config, x, y);
  const bounds = plotBounds(host, type);
  if (!bounds || !contains(bounds, x, y)) return null;
  const measured = targets.map(target => ({target, box: target.element.getBoundingClientRect()}));
  if (type === 'grouped-bar-chart' || type === 'waterfall-chart' || type === 'stacked-bar-chart') {
    // Distance to the bar edges splits each gap exactly in half, including
    // uneven widths. Stacks share X; Y then selects the closest segment.
    measured.sort((a, b) => distance(x, a.box.left, a.box.right) - distance(x, b.box.left, b.box.right)
      || distance(y, a.box.top, a.box.bottom) - distance(y, b.box.top, b.box.bottom));
  } else if (type === 'line-chart') {
    const xDistance = entry => Math.abs(x - (entry.box.left + entry.box.right) / 2);
    const closest = Math.min(...measured.map(xDistance));
    const column = measured.filter(entry => Math.abs(xDistance(entry) - closest) < 0.01);
    column.sort((a, b) => Math.abs(y - (a.box.top + a.box.bottom) / 2) - Math.abs(y - (b.box.top + b.box.bottom) / 2));
    return column[0]?.target || null;
  } else {
    measured.sort((a, b) => Math.hypot(x - (a.box.left + a.box.right) / 2, y - (a.box.top + a.box.bottom) / 2)
      - Math.hypot(x - (b.box.left + b.box.right) / 2, y - (b.box.top + b.box.bottom) / 2));
  }
  return measured[0]?.target || null;
}
