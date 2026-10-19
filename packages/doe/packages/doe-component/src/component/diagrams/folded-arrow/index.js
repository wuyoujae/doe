import { art, add, marker, rightSlot } from '../shared/svg.js';

// Equal projected side lengths; adjacent squares overlap by 3/4 and 1/4.
const U = { x: 144, y: 36 };
const V = { x: -90, y: Math.sqrt(U.x ** 2 + U.y ** 2 - 90 ** 2) };
const SHIFT = { x: -U.x / 4 - V.x * .75, y: -U.y / 4 - V.y * .75 };
const point = (origin, u, v) => ({ x: origin.x + U.x * u + V.x * v, y: origin.y + U.y * u + V.y * v });
const path = points => points.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join('');

export const config = { type: 'folded-arrow', artIcons: true, iconFallback: 'ArrowRight', min: 1, max: 4, geometry(document, props) {
  const count = props.items.length, step = -SHIFT.y;
  const top = 12 + V.y * .55, height = top + (count - 1) * step + U.y + V.y + 12;
  const svg = art(document, height), slots = [];
  for (let i = 0; i < count; i++) {
    const origin = { x: 102 + i * SHIFT.x, y: top + (count - 1 - i) * step };
    const corners = [point(origin, 0, 0), point(origin, 1, 0), point(origin, 1, 1), point(origin, 0, 1)];
    const fill = i % 2 ? 'var(--yrkie-color-chart-4)' : 'var(--yrkie-color-primary)';
    const layer = add(svg, 'g', { class: 'doe-folded-arrow__layer' });
    if (i) {
      // The return fold belongs to this upper sheet. Its hidden edges remain covered.
      const joint = [point(origin, 1, .75), corners[2], point(origin, 1.25, .75)];
      add(layer, 'path', { class: 'doe-folded-arrow__fold', d: path(joint) + 'Z', fill });
      add(layer, 'path', { class: 'doe-folded-arrow__crease', d: path(joint), fill: 'none', stroke: 'var(--yrkie-color-chart-5)', 'stroke-width': 1, 'stroke-opacity': .6, 'stroke-linejoin': 'round' });
    }
    const outline = i === count - 1
      ? [corners[3], corners[0], point(origin, -.2, 0), point(origin, .5, -.55), point(origin, 1.2, 0), corners[1], corners[2]]
      : corners;
    add(layer, 'path', { class: 'doe-folded-arrow__face', d: path(outline) + 'Z', fill });
    const label = point(origin, .44, .65);
    marker(layer, label.x, label.y, i).style.setProperty('color', 'var(--yrkie-color-on-primary)');
    const center = point(origin, .5, .65);
    // Spread copy into the headroom while keeping the bottom group anchored.
    const copyX = Math.max(...outline.map(p => p.x)) + 22;
    slots.push({ ...rightSlot(copyX, center.y - (step - 8) / 2 - i * 24, step - 8), alignY: 'center' });
  }
  return { svg, height, slots };
} };
