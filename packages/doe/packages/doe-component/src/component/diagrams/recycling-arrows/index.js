import { art, add, color, marker, rightSlot, leftSlot } from '../shared/svg.js';

let instance = 0;
const FRONT = [[500, 35], [610, 35], [693, 179], [732, 179], [659, 255], [546, 199], [500 + 164 / Math.sqrt(3), 199]];
const BACK = [[500, 35], [438, 129], [500 + 94 / Math.sqrt(3), 129]];
const polygon = points => `M${points.map(p => p.join(' ')).join('L')}Z`;
const rotate = ([a, b], i) => {
  const x = 572 + (a - 572) * .88, y = 135 + (b - 135) * .88, angle = i * 2 * Math.PI / 3;
  return [550 + (x - 550) * Math.cos(angle) - (y - 250) * Math.sin(angle), 250 + (x - 550) * Math.sin(angle) + (y - 250) * Math.cos(angle)];
};
const bounds = points => ({ left: Math.min(...points.map(p => p[0])), right: Math.max(...points.map(p => p[0])), top: Math.min(...points.map(p => p[1])), bottom: Math.max(...points.map(p => p[1])) });
const arrows = [0, 1, 2].map(i => [...FRONT, ...BACK].map(p => rotate(p, i))), extent = bounds(arrows.flat());
const dx = 550 - (extent.left + extent.right) / 2, dy = 250 - (extent.top + extent.bottom) / 2;

export const config = { type: 'recycling-arrows', artIcons: true, iconFallback: 'RotateCw', min: 3, max: 3, geometry(document) {
  const svg = art(document, 500), defs = add(svg, 'defs'), prefix = `recycling-${++instance}`;
  const artwork = add(svg, 'g', { class: 'doe-recycling__artwork', transform: `translate(${dx} ${dy})` });
  // Identical folded ribbons and 120-degree rotations give equal openings.
  [0, 3, 2].forEach((tone, i) => {
    const fill = color(tone), frontId = `${prefix}-front-${i}`, backId = `${prefix}-back-${i}`, foldId = `${prefix}-fold-${i}`;
    const front = add(defs, 'linearGradient', { id: frontId, x1: '0%', y1: '0%', x2: '100%', y2: '100%' });
    for (const [offset, shade] of [[0, `color-mix(in srgb, ${fill} 76%, var(--yrkie-color-on-primary))`], [45, fill], [100, `color-mix(in srgb, ${fill} 70%, var(--yrkie-color-chart-5))`]])
      add(front, 'stop', { offset: `${offset}%`, 'stop-color': shade });
    const back = add(defs, 'linearGradient', { id: backId, gradientUnits: 'userSpaceOnUse', x1: 454, y1: 118, x2: 538, y2: 78 });
    add(back, 'stop', { offset: '0%', 'stop-color': `color-mix(in srgb, ${fill} 80%, var(--yrkie-color-on-primary))` });
    add(back, 'stop', { offset: '100%', 'stop-color': 'var(--yrkie-color-chart-5)' });
    // A rounded return joins the two faces at one crease, with no extruded outline.
    const fold = add(defs, 'linearGradient', { id: foldId, gradientUnits: 'userSpaceOnUse', x1: 525, y1: 88, x2: 537, y2: 81 });
    for (const [offset, shade] of [[0, fill], [35, 'var(--yrkie-color-chart-5)'], [70, fill], [100, `color-mix(in srgb, ${fill} 55%, var(--yrkie-color-on-primary))`]])
      add(fold, 'stop', { offset: `${offset}%`, 'stop-color': shade });
    const group = add(artwork, 'g', { class: 'doe-recycling__arrow', transform: `rotate(${i * 120} 550 250)` });
    const ribbon = add(group, 'g', { transform: 'translate(572 135) scale(.88) translate(-572 -135)' });
    add(ribbon, 'path', { class: 'doe-recycling__back', d: polygon(BACK), fill: `url(#${backId})` });
    add(ribbon, 'path', { class: 'doe-recycling__front', d: polygon(FRONT), fill: `url(#${frontId})` });
    add(ribbon, 'path', { class: 'doe-recycling__fold', d: `M500 35C494 42 497 51 501 58L542 129L${BACK[2].join(' ')}Z`, fill: `url(#${foldId})` });
    const [x, y] = rotate([603, 141], i), label = marker(artwork, x, y, i);
    label.style.setProperty('color', 'var(--yrkie-color-on-primary)');
  });
  const [first, second, third] = arrows.map(bounds), gap = 24;
  return { svg, height: 500, slots: [rightSlot(first.right + dx + gap, 58, 140), rightSlot(second.right + dx + gap, 348, 140), { ...leftSlot(third.left + dx - gap, 184, 140), align: 'right' }] };
} };
