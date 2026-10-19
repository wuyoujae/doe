import { art, add, color, marker, leftSlot, rightSlot } from '../shared/svg.js';
export const config = { type: 'layered-cube', artIcons: true, iconFallback: 'Layers', min: 1, max: 4, geometry(document, props) {
  const count = props.items.length, rows = Math.ceil(count / 2), step = 165, height = rows * step + 135;
  const svg = art(document, height), slots = [];
  add(svg, 'path', { d: 'M550 4L708 95L550 186L392 95Z', fill: color(1), stroke: 'var(--yrkie-color-light)', 'stroke-width': 2 });
  for (let row = 0; row < rows; row++) {
    const y = 95 + row * step;
    for (let side = 0; side < 2; side++) {
      const index = row * 2 + side, x = side ? 708 : 392;
      add(svg, 'path', { d: `M${x} ${y}L550 ${y + 91}V${y + 91 + step}L${x} ${y + step}Z`, fill: color(index), stroke: 'var(--yrkie-color-light)', 'stroke-width': 2 });
      if (index < count) {
        marker(svg, side ? 632 : 468, y + 125, index);
        slots.push(side ? rightSlot(732, y + 25, 140) : leftSlot(368, y + 25, 140));
      }
    }
  }
  return { svg, height: height + 55, slots };
} };
