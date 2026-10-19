import { art } from '../art/index.js';
import { number } from '../number/index.js';
import { fullCircleGeometry } from './geometry/index.js';
import { scope } from '../runtime/context/index.js';

export function fullCircle(count = 3) {
  const svg = art(340, 360), { paths, angles, labelRadius } = fullCircleGeometry(count);
  paths.forEach((d, index) => {
    svg.append(scope.svgNode('path', { d, class: 'shape-contents__shape' }));
    number(svg, 170 + labelRadius * Math.cos(angles[index]), 180 + labelRadius * Math.sin(angles[index]), index);
  });
  return svg;
}
