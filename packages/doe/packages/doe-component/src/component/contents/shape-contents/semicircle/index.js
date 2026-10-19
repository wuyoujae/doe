import { art } from '../art/index.js';
import { number } from '../number/index.js';
import { annularSector } from '../annular-sector/index.js';
import { scope } from '../runtime/context/index.js';

export function semicircle(count = 3) {
  const svg = art(640, 322), step = Math.PI / count;
  for (let index = 0; index < count; index++) {
    const start = Math.PI + index * step, end = start + step, angle = (start + end) / 2;
    svg.append(scope.svgNode('path', { d: annularSector(320, 320, 300, 150, start, end), class: 'shape-contents__shape' }));
    number(svg, 320 + 225 * Math.cos(angle), 320 + 225 * Math.sin(angle), index);
  }
  return svg;
}
