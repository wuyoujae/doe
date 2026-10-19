/** Use the painted SVG bounds as the natural viewport, then let legends reflow. */
export function fitChartContent(host) {
  const svg = host.querySelector(':scope > svg');
  if (!svg || !host.isConnected || typeof svg.getBBox !== 'function') return;
  // Clipped plots (e.g. risk bands) intentionally draw beyond their viewport.
  // Their raw geometry bounds are not their visible bounds.
  if (svg.querySelector('[clip-path]')) return;
  const bounds = svg.getBBox();
  const view = svg.viewBox.baseVal;
  if (!(bounds.height > 0 && view.width > 0)) return;
  // getBBox excludes strokes and marker tips. Keep their painted extent without
  // retaining the unused, symmetric viewport below odd-sided radial charts.
  const bleed = Math.max(1, ...[...svg.querySelectorAll('[stroke], line, path, polygon, circle, ellipse, rect')]
    .filter(node => !node.closest('defs'))
    .map(node => {
      const style = getComputedStyle(node);
      return (parseFloat(style.strokeWidth) || 0) / 2
        + (style.markerEnd !== 'none' || style.markerStart !== 'none' ? 8 : 0);
    }));
  const top = Math.floor(bounds.y - bleed);
  const bottom = Math.ceil(bounds.y + bounds.height + bleed);
  const height = bottom - top;
  host.dataset.chartWidthFits = String(bounds.x >= view.x - 1 && bounds.x + bounds.width <= view.x + view.width + 1);
  svg.setAttribute('viewBox', `${view.x} ${top} ${view.width} ${height}`);
  svg.style.flex = 'none';
  svg.style.height = `${height * host.clientWidth / view.width}px`;
  host.style.height = 'auto';
  host.dataset.chartNaturalHeight = 'true';
}
