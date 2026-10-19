import { radialAngles } from '../../radial-angles/index.js';
import { annularSector } from '../../annular-sector/index.js';

export function fullCircleGeometry(count) {
  const angles = radialAngles(count), half = Math.PI / count;
  return { paths: angles.map(angle => annularSector(170, 180, 164, 66, angle - half, angle + half)), angles, labelRadius: 115 };
}
