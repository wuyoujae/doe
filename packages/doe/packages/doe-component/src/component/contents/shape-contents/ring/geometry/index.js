import { radialAngles } from '../../radial-angles/index.js';

/** Equal thin ring segments sit behind circular numbered nodes. */
export function ringGeometry(count) {
  const outer = 145, inner = 135, labelRadius = 140, nodeRadius = 22;
  const angles = radialAngles(count), half = Math.PI / count;
  const point = (radius, angle) => `${170 + radius * Math.cos(angle)} ${180 + radius * Math.sin(angle)}`;
  const paths = angles.map(angle => `M${point(outer, angle - half)} A${outer} ${outer} 0 0 1 ${point(outer, angle + half)} L${point(inner, angle + half)} A${inner} ${inner} 0 0 0 ${point(inner, angle - half)} Z`);
  return { paths, angles, labelRadius, nodeRadius };
}
