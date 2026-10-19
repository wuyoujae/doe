import { radialAngles } from '../../radial-angles/index.js';

const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
const subtract = (a, b) => [a[0] - b[0], a[1] - b[1]];
function offsetLine(a, b, offset) {
  const d = subtract(b, a), length = Math.hypot(...d);
  return { p: [a[0] - d[1] * offset / length, a[1] + d[0] * offset / length], d };
}
function intersect(a, b) {
  const t = cross(subtract(b.p, a.p), b.d) / cross(a.d, b.d);
  return [a.p[0] + a.d[0] * t, a.p[1] + a.d[1] * t];
}
function circleEnd(line, radius, near) {
  const { p, d } = line, a = d[0] ** 2 + d[1] ** 2, b = 2 * (p[0] * d[0] + p[1] * d[1]);
  const disc = Math.sqrt(b * b - 4 * a * (p[0] ** 2 + p[1] ** 2 - radius ** 2));
  return [(-b + disc) / (2 * a), (-b - disc) / (2 * a)].map(t => [p[0] + d[0] * t, p[1] + d[1] * t]).sort((u, v) => Math.hypot(...subtract(u, near)) - Math.hypot(...subtract(v, near)))[0];
}
function segmentDistance(p, a, b) {
  const d = subtract(b, a), v = subtract(p, a), t = Math.max(0, Math.min(1, (v[0] * d[0] + v[1] * d[1]) / (d[0] ** 2 + d[1] ** 2)));
  return Math.hypot(v[0] - d[0] * t, v[1] - d[1] * t);
}
/** Offset both legs of the arrow seam normally, rather than rotating its boundary. */
export function cycleGeometry(count) {
  const outer = 164, inner = 66, middle = 115, halfGap = 4;
  const step = 2 * Math.PI / count, tip = Math.min(17 * Math.PI / 180, step * 0.28);
  const polar = (radius, angle) => [radius * Math.cos(angle), radius * Math.sin(angle)];
  const at = p => `${170 + p[0]} ${180 + p[1]}`;
  const seam = (angle, offset) => {
    const i = polar(inner, angle), m = polar(middle, angle + tip), o = polar(outer, angle);
    const a = offsetLine(i, m, offset), b = offsetLine(m, o, offset);
    return { inner: circleEnd(a, inner, i), tip: intersect(a, b), outer: circleEnd(b, outer, o) };
  };
  const angles = radialAngles(count);
  // Seam tips intrude toward the label as the count grows; the bands bound it radially.
  let clearance = Math.min(middle - inner, outer - middle);
  const paths = angles.map(angle => {
    const start = seam(angle - step / 2, halfGap), end = seam(angle + step / 2, -halfGap), label = polar(middle, angle);
    for (const { inner: i, tip: t, outer: o } of [start, end]) clearance = Math.min(clearance, segmentDistance(label, i, t), segmentDistance(label, t, o));
    return `M${at(start.outer)} A${outer} ${outer} 0 0 1 ${at(end.outer)} L${at(end.tip)} L${at(end.inner)} A${inner} ${inner} 0 0 0 ${at(start.inner)} L${at(start.tip)} Z`;
  });
  return { paths, angles, labelRadius: middle, clearance };
}
