export { radialAngles as petalAngles } from '../../radial-angles/index.js';

export function petalGeometry(count) {
  const half = Math.PI / count, tip = 4 / Math.sin(half);
  const distance = (164 - tip) / (1 + Math.sin(half)), radius = distance * Math.sin(half);
  const x = tip + distance * Math.cos(half) ** 2, y = distance * Math.sin(half) * Math.cos(half);
  const path = count === 2
    ? 'M4 -85 C4 -135 35 -166 76 -166 C137 -166 164 -75 164 0 C164 75 137 166 76 166 C35 166 4 135 4 85Z'
    : `M${tip} 0 L${x} ${-y} A${radius} ${radius} 0 1 1 ${x} ${y}Z`;
  return { path, labelRadius: count === 2 ? 85 : tip + distance };
}
