import { art, add, marker, leftSlot } from '../shared/svg.js';

export const config = { type: 'wave-arrow', artIcons: true, iconFallback: 'ArrowRight', min: 3, max: 3, geometry(document) {
  const height = 472, svg = art(document, height);
  const ribbon = add(svg, 'g', { class: 'doe-wave-arrow__ribbon', transform: 'translate(480 8) scale(.765)' });

  // One continuous silhouette owns both rising faces, the valleys and the arrowhead.
  add(ribbon, 'path', {
    class: 'doe-wave-arrow__face',
    d: 'M0 549C58 377 112 288 166 273L323 298C350 234 374 196 400 189L529 202L554 143L508 138L694 0L785 169L738 158C704 277 673 335 641 318L518 291C488 370 450 452 418 448L239 408C213 468 187 534 155 594Z',
  });
  // The return faces share the silhouette's lower edges. Only the curling edge is lit.
  for (const edge of [
    'M239 408C267 359 294 310 330 305C379 292 386 367 390 416C392 433 393 441 395 444',
    'M518 291C546 232 565 214 589 212C630 205 630 285 641 318',
  ]) {
    add(ribbon, 'path', { class: 'doe-wave-arrow__return', d: `${edge}Z` });
    add(ribbon, 'path', { class: 'doe-wave-arrow__edge', d: edge, fill: 'none', 'stroke-width': 7, 'stroke-linecap': 'butt' });
  }
  [[191,329],[448,236],[653,112]].forEach(([x,y],i) => {
    marker(svg, 480 + x * .765, 8 + y * .765, i, 0).style.setProperty('color', 'var(--yrkie-color-on-primary)');
  });
  const slots = [[492,286,100],[678,146,68],[865,36,68]].map(([right,y,h]) => leftSlot(right,y,h));
  return { svg, height, slots };
} };
