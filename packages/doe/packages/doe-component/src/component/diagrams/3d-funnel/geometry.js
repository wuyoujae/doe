import { COPY_BOUNDS } from '../../../layout/flow/copy-bounds.js';
import { toPixels } from '../../../layout/flow/contract.js';
export const FUNNEL = Object.freeze({ width: 960, height: 300, referenceItems: 5, minItems: 1, maxItems: 4, copyMaxHeight: toPixels(COPY_BOUNDS.maximumHeightPt) });

const radius = FUNNEL.height / 2 - 1, depth = .32;
const end = FUNNEL.width - radius * depth - 1, step = end / (FUNNEL.referenceItems + .5);

export function funnelSize(count) {
  const front = step * (count + .5), ry = radius * front / end;
  return { width: front + ry * depth + 1, height: (ry + 1) * 2 };
}

/** Sections narrow in reading order; copy never changes the artwork. */
export function funnelGeometry(count) {
  // Mirror the established cone geometry without reversing authored items.
  const size = funnelSize(count), cy = size.height / 2;
  return Array.from({ length: count }, (_, index) => {
    const section = count - index - 1;
    const originalFront = step * (section + 1.5), ry = radius * originalFront / end, rx = ry * depth;
    const previous = section ? step * (section + .5) : 0;
    const back = previous + radius * previous / end * depth * 1.6;
    const backRy = radius * back / end, backRx = backRy * depth;
    const front = size.width - originalFront, rear = size.width - back;
    const d = section === 0
      ? `M${size.width - 1} ${cy}L${front} ${cy - ry}A${rx} ${ry} 0 0 0 ${front} ${cy + ry}Z`
      : `M${rear} ${cy - backRy}L${front} ${cy - ry}A${rx} ${ry} 0 0 0 ${front} ${cy + ry}L${rear} ${cy + backRy}A${backRx} ${backRy} 0 0 0 ${rear} ${cy - backRy}Z`;
    return { d, front, cy, rx, ry, center: size.width - (back + originalFront) / 2, bottom: cy + ry };
  });
}
