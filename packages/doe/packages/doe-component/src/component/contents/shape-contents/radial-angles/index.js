/** Clockwise order starts on the left, then follows the outside copy around the ring. */
export function radialAngles(count) {
  const start = count === 2 || count === 3 ? 180 : count === 5 ? -144 : -90 - 180 / count;
  return Array.from({ length: count }, (_, index) => (start + index * 360 / count) * Math.PI / 180);
}
