import { art, add, leftSlot, rightSlot } from '../shared/svg.js';
import { sideOf } from '../shared/register.js';

let instance = 0;
const primary = 'var(--yrkie-color-primary)', blue = 'var(--yrkie-color-chart-4)', dark = 'var(--yrkie-color-chart-3)', deep = 'var(--yrkie-color-chart-5)';
const highlight = `color-mix(in srgb, ${blue} 58%, var(--yrkie-color-on-primary))`;
// Curved boundaries follow the ribbon around the opening instead of slicing it into horizontal bands.
const face = 'M211 0C94 0 0 95 0 212C0 329 95 423 212 423C329 423 424 329 424 212C424 95 328 0 211 0Z';
const innerFold = 'M0 212C0 122 67 50 150 50C239 50 309 110 309 213C309 242 316 273 334 302C307 330 273 347 236 347C168 347 113 291 113 213C113 158 157 114 211 114C130 114 65 191 65 266C65 354 129 413 212 423C95 423 0 329 0 212Z';
const returnFold = 'M211 114C130 114 65 191 65 266C65 354 129 413 212 423C156 410 113 335 113 213C113 158 157 114 211 114Z';
const silhouette = 'M0 212C0 95 95 0 211 0C274 0 331 28 368 72C405 27 455 0 515 0C632 0 726 95 726 212C726 325 633 412 517 412C458 412 405 387 369 349C332 394 276 423 212 423C95 423 0 329 0 212Z';
const openings = 'M309 213A98 98 0 1 0 113 213A98 98 0 1 0 309 213Z M614 213A98 98 0 1 0 418 213A98 98 0 1 0 614 213Z';
export const config = { type: 'double-ring', icons: true, iconFallback: 'Link2', min: 2, max: 6,
  prepareItemCollection(values, previous, order) {
    return values.map((item, index) => {
      const oldIndex = order?.[index] ?? previous.findIndex(old => old === item || item.id && old.id === item.id);
      return { ...item, side: item.side || sideOf(previous[oldIndex] || item, Math.max(0, oldIndex)) };
    });
  },
  createItem(value, values) {
    const left = values.filter((item, i) => sideOf(item, i) === 'left').length;
    return { ...value, side: left <= values.length - left ? 'left' : 'right' };
  },
  canDeleteItem(values, index) { return values.filter((item, i) => sideOf(item, i) === sideOf(values[index], index)).length > 1; },
  geometry(document, props) {
    const height = 480, svg = art(document, height), slots = [], positions = { left: 0, right: 0 };
    const defs = add(svg, 'defs'), prefix = `double-ring-${++instance}`, scale = 614 / 726;
    const gradient = (name, vector, stops) => {
      const id = `${prefix}-${name}`, node = add(defs, 'linearGradient', { id, gradientUnits: 'userSpaceOnUse', x1: vector[0], y1: vector[1], x2: vector[2], y2: vector[3] });
      stops.forEach(([offset, color]) => add(node, 'stop', { offset, 'stop-color': color }));
      return `url(#${id})`;
    };
    const front = gradient('front', [55, 10, 344, 380], [[0, highlight], [.42, blue], [.76, primary], [1, dark]]);
    const inside = gradient('inside', [0, 187, 334, 210], [[0, primary], [.32, dark], [.8, dark], [1, deep]]);
    const turn = gradient('turn', [100, 205, 207, 358], [[0, highlight], [.45, blue], [1, primary]]);
    const rear = gradient('rear', [376, 0, 681, 212], [[0, highlight], [.5, blue], [1, primary]]);
    const backTurn = gradient('back-turn', [120, 213, 211, 423], [[0, primary], [.3, blue], [1, highlight]]);
    const clip = add(defs, 'clipPath', { id: `${prefix}-openings` });
    add(clip, 'path', { d: `${silhouette} ${openings}`, 'clip-rule': 'evenodd' });
    const artwork = add(svg, 'g', { class: 'doe-double-ring__artwork', transform: `translate(243 61) scale(${scale})` });
    const surfaces = add(artwork, 'g', { 'clip-path': `url(#${prefix}-openings)` });
    add(surfaces, 'path', { class: 'doe-double-ring__surface', d: silhouette, fill: rear });
    // The rear ring curls in the opposite direction; the left front face covers their join.
    const back = add(surfaces, 'g', { transform: 'translate(727 426) rotate(180)' });
    add(back, 'path', { class: 'doe-double-ring__inner-fold', d: innerFold, fill: inside });
    add(back, 'path', { class: 'doe-double-ring__return-fold', d: returnFold, fill: backTurn });
    add(surfaces, 'path', { class: 'doe-double-ring__surface', d: face, fill: front });
    add(surfaces, 'path', { class: 'doe-double-ring__inner-fold', d: innerFold, fill: inside });
    add(surfaces, 'path', { class: 'doe-double-ring__return-fold', d: returnFold, fill: turn });
    props.items.forEach((item, index) => {
      const side = sideOf(item, index), count = props.items.filter((value, i) => sideOf(value, i) === side).length;
      const position = positions[side]++, y = (position + .5) * height / count - 65;
      const centerX = 243 + (side === 'left' ? 211 : 516) * scale;
      slots.push({ ...(side === 'left' ? leftSlot(219, y, 140) : rightSlot(881, y, 140)),
        icon: { x: centerX - 20, y: 61 + 213 * scale + (position - (count - 1) / 2) * 44 - 20, w: 40, h: 40, dark: true } });
    });
    return { svg, height, slots };
  },
};
