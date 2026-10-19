import { art, add, rightSlot } from '../shared/svg.js';
const color = index => index % 2 ? 'var(--yrkie-color-chart-4)' : 'var(--yrkie-color-primary)';
export const config = { type: 'concentric-circles', min: 1, max: 4, icons: true, geometry(document, props) {
  const count = props.items.length, radius = index => 70 + index * 46, outer = radius(count - 1);
  const height = Math.max(outer * 2 + 24, count * 120), cx = outer + 20, cy = height / 2;
  const svg = art(document, height), slots = [];
  for (let i = count - 1; i >= 0; i--) add(svg, 'circle', { class: 'doe-bullseye__ring', cx, cy, r: radius(i), fill: color(i), stroke: 'var(--yrkie-line-strong)', 'stroke-width': 1 });
  props.items.forEach((_, i) => {
    const angle = count === 1 ? 0 : (-42 + 84 * i / (count - 1)) * Math.PI / 180;
    const x = cx + 300 + (count > 2 ? 38 * Math.sin(Math.PI * i / (count - 1)) : 0), y = (i + .5) * height / count;
    add(svg, 'line', { class: 'doe-bullseye__connector', x1: cx + radius(i) * Math.cos(angle), y1: cy + radius(i) * Math.sin(angle), x2: x, y2: y, stroke: 'var(--yrkie-color-chart-5)', 'stroke-width': 1.5 });
    add(svg, 'circle', { class: 'doe-bullseye__badge', cx: x, cy: y, r: 32, fill: color(i) });
    slots.push({ ...rightSlot(x + 52, y - 48, 96), alignY: 'center', icon: { x: x - 18, y: y - 18, w: 36, h: 36 } });
  });
  return { svg, height, slots };
} };
