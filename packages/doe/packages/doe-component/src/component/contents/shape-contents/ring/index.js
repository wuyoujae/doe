import { art } from '../art/index.js';
import { number } from '../number/index.js';
import { ringGeometry } from './geometry/index.js';
import { circleIconLimit } from '../icon-fit/index.js';
import { scope } from '../runtime/context/index.js';

export function ring(count = 3) {
  const svg = art(340, 360), { paths, angles, labelRadius, nodeRadius } = ringGeometry(count);
  svg.setAttribute('data-icon-limit', String(circleIconLimit(nodeRadius)));
  paths.forEach(d => svg.append(scope.svgNode('path', { d, class: 'shape-contents__shape' })));
  angles.forEach((angle, index) => {
    const cx = 170 + labelRadius * Math.cos(angle), cy = 180 + labelRadius * Math.sin(angle);
    svg.append(scope.svgNode('circle', { cx, cy, r: nodeRadius, class: 'shape-contents__ring-node' }));
    number(svg, cx, cy, index);
  });
  return svg;
}
