import { art, add } from '../shared/svg.js';
import { ROUND_BADGE_RADIUS } from '../shared/badge-geometry.js';
export const config = { type: 'serpentine-process', min: 1, max: 6, icons: true, geometry(document, props) {
  const count = props.items.length, columns = Math.ceil(count / 2), height = count === 1 ? 246 : 380 + ROUND_BADGE_RADIUS + 2, svg = art(document, height), slots = [];
  add(svg, 'path', { d: count === 1 ? 'M0 100H1100' : 'M0 100H1020A70 70 0 0 1 1020 240H80A70 70 0 0 0 80 380H1100', fill: 'none', stroke: 'var(--yrkie-color-primary)', 'stroke-width': 4 });
  props.items.forEach((_, i) => {
    const bottom = i >= columns, column = bottom ? i - columns : i, n = bottom ? count - columns : columns;
    const x = 110 + (column + .5) * 880 / n, y = bottom ? 380 : 100, r = ROUND_BADGE_RADIUS;
    add(svg, 'path', { class: 'doe-serpentine__badge', d: bottom ? `M${x-r} ${y}A${r} ${r} 0 0 0 ${x+r} ${y}Z` : `M${x-r} ${y}A${r} ${r} 0 0 1 ${x+r} ${y}Z`, fill: 'var(--yrkie-color-primary)' });
    slots.push({ x: x - 880 / n / 2 + 12, y: bottom ? 246 : 118, w: 880 / n - 24, h: 116, align: 'center', alignY: bottom ? 'bottom' : 'top', icon: { x: x - 27, y: y + (bottom ? r / 2 : -r / 2) - 27, w: 54, h: 54 } });
  });
  return { svg, height, slots };
} };
