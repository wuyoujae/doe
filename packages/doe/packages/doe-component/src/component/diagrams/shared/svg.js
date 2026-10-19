import { svgItemIcon } from '../../../shared/item-icon/index.js';

export const WIDTH = 1100;
export const color = index => `var(--yrkie-color-chart-${index % 5 + 1})`;
export function add(parent, tag, attributes = {}) {
  const node = parent.ownerDocument.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value)));
  parent.append(node); return node;
}
export function art(document, height) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${WIDTH} ${height}`); svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('doe-diagram__art'); return svg;
}
export function marker(parent, x, y, index, fillIndex = index) {
  const node = svgItemIcon(parent, x, y, index, undefined, 'CircleDot', 'doe-diagram__marker', 40);
  node.style.color = fillIndex % 5 === 1 ? 'var(--yrkie-color-title)' : 'var(--yrkie-color-on-primary)';
  return node;
}
export const rightSlot = (x, y, h = 110) => ({ x, y, w: WIDTH - x, h, expand: 'right', align: 'left' });
export const leftSlot = (right, y, h = 110) => ({ x: 0, y, w: right, h, expand: 'left', align: 'right' });
