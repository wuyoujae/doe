/** Marker icon fitting, in the artwork's native units. */
export const ICON_SIZE = 36;
// Lucide strokes stay within one unit of the 24-unit icon box.
const INK = 22 / 24;
// Clear space around the ink, relative to its half-extent.
const CLEARANCE = 1.2;
const reach = size => size * INK * CLEARANCE / 2;

export function sizeIcon(marker, size) {
  const icon = marker.querySelector('svg');
  for (const [key, value] of Object.entries({ x: -size / 2, y: -size / 2, width: size, height: size })) icon.setAttribute(key, String(value));
}

/** Rotation-independent limit for an anchor whose nearest shape edge is `radius` away. */
export const circleIconLimit = radius => Math.SQRT2 * radius / (INK * CLEARANCE);

// Symmetric trapezoid rows: half-widths change linearly from `top` to `bottom`.
function normalize({ top, bottom, halfTop, halfBottom }) {
  const height = bottom - top, narrow = Math.min(halfTop, halfBottom);
  return { flipped: halfTop > halfBottom, height, narrow, slope: (Math.max(halfTop, halfBottom) - narrow) / height };
}

/** Largest icon once it slides fully toward the wide edge. */
export function trapezoidIconLimit(shape) {
  const { height, narrow, slope } = normalize(shape);
  return Math.min((narrow + slope * height) / (1 + 2 * slope), height / 2) / reach(1);
}

/** Keeps the preferred center when the icon fits there, otherwise the nearest center that fits. */
export function trapezoidIconCenter(shape, size, preferred) {
  const { flipped, height, narrow, slope } = normalize(shape), half = reach(size);
  const low = half + (slope > 0 ? Math.max(0, (half - narrow) / slope) : 0);
  const offset = Math.min(height - half, Math.max(low, flipped ? shape.bottom - preferred : preferred - shape.top));
  return flipped ? shape.bottom - offset : shape.top + offset;
}
