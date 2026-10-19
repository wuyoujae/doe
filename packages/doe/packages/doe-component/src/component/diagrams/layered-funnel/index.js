import { WIDTH, art, add, rightSlot } from '../shared/svg.js';
const REFERENCE_ITEMS = 5;
export const config = { type: 'layered-funnel', min: 1, max: 4, geometry(document, props) {
  const svg = art(document, 0), slots = [], cx = 235, depth = 64;
  const rx = i => (220 - i * 135 / REFERENCE_ITEMS) * .85, ry = i => 34 - i * 15 / REFERENCE_ITEMS;
  let y = 10 + ry(0), bottomEdge = 0;
  props.items.forEach((_, i) => {
    const layer = add(svg, 'g', { class: 'doe-layered-funnel__layer', 'data-layer-index': i });
    // Like the horizontal funnel, the rounded rear partly overlaps the next face.
    const pitch = depth + ry(i + 1) * 1.6, bottom = y + depth;
    const backRx = rx(i) + (rx(i + 1) - rx(i)) * depth / pitch;
    const backRy = ry(i) + (ry(i + 1) - ry(i)) * depth / pitch;
    add(layer, 'path', { class: 'diagram-3d-funnel__body', d: `M${cx-rx(i)} ${y}L${cx-backRx} ${bottom}A${backRx} ${backRy} 0 0 0 ${cx+backRx} ${bottom}L${cx+rx(i)} ${y}Z` });
    const face = { cx, cy: y, rx: rx(i), ry: ry(i) };
    add(layer, 'ellipse', { ...face, class: 'diagram-3d-funnel__face' });
    add(layer, 'ellipse', { ...face, class: 'diagram-3d-funnel__shade' });
    slots.push({ ...rightSlot(cx + rx(i) + 22, y, depth), alignY: 'center' });
    svg.prepend(layer);
    bottomEdge = bottom + backRy;
    y += pitch;
  });
  const height = bottomEdge + 10;
  svg.setAttribute('viewBox', `0 0 ${WIDTH} ${height}`);
  return { svg, height, slots };
} };
