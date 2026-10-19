import { expandRadialCopy } from './copy-width.js';
import { ringGeometry } from '../ring/geometry/index.js';
import { fullCircleGeometry } from '../full-circle/geometry/index.js';
import { cycleGeometry } from '../cycle-arrows/geometry/index.js';
import { petalGeometry } from '../petals/geometry/index.js';
import { radialAngles } from '../radial-angles/index.js';

/** External copy stays in author order; positions alone follow the radial artwork. */
export function layoutRadialContents(root, { width, gap, artWidth, copyHeight = 160, copyHeights, geometryWidth = width, expandCopy = false }) {
  const copies = [...root.querySelectorAll('.shape-contents__copy')], art = root.querySelector('.shape-contents__art');
  const count = copies.length, sideCopy = root.dataset.variant !== 'semicircle';
  const copyWidth = sideCopy ? (geometryWidth - artWidth - 2 * gap) / 2 : (geometryWidth - (count - 1) * gap) / (Math.max(4, count) + 1);
  const heights = copyHeights || copies.map(() => copyHeight);
  copies.forEach((copy, index) => { copy.style.width = `${copyWidth}px`; copy.style.height = `${heights[index]}px`; });
  if (sideCopy) {
    const geometry = { petals: petalGeometry, 'cycle-arrows': cycleGeometry, 'full-circle': fullCircleGeometry, ring: ringGeometry }[root.dataset.variant](count);
    const angles = radialAngles(count);
    const sides = [true, false].map(left => angles.map((angle, index) => ({ angle, index })).filter(({ angle }) => (Math.cos(angle) < -0.001) === left).sort((a, b) => Math.sin(a.angle) - Math.sin(b.angle)));
    const required = Math.max(...sides.map(indices => indices.reduce((sum, { index }) => sum + heights[index], 0) + Math.max(0, indices.length - 1) * gap));
    const artHeight = artWidth * 360 / 340, total = Math.max(artHeight, required);
    const labelRadius = geometry.labelRadius * artWidth / 340;
    for (const left of [true, false]) {
      const indices = sides[left ? 0 : 1];
      const positions = indices.map(({ angle, index }) => Math.max(0, Math.min(total - heights[index], total / 2 + labelRadius * Math.sin(angle) - heights[index] / 2)));
      for (let i = 1; i < positions.length; i++) positions[i] = Math.max(positions[i], positions[i - 1] + heights[indices[i - 1].index] + gap);
      if (positions.length) positions[positions.length - 1] = Math.min(positions.at(-1), total - heights[indices.at(-1).index]);
      for (let i = positions.length - 2; i >= 0; i--) positions[i] = Math.min(positions[i], positions[i + 1] - heights[indices[i].index] - gap);
      indices.forEach(({ index }, row) => {
        copies[index].style.left = `${left ? (width - geometryWidth) / 2 : (width + geometryWidth) / 2 - copyWidth}px`;
        copies[index].style.top = `${positions[row]}px`;
        copies[index].style.textAlign = left ? 'right' : 'left';
      });
    }
    art.style.top = `${(total - artHeight) / 2}px`;
    root.style.height = `${total}px`;
  } else {
    // Centre copy vertically on its sector's outer arc, then move its inner
    // edge outside the circle using the rectangle's lowest point for clearance.
    // Keep the original maximum box as the artwork/width envelope. Growing
    // a label must not resize the semicircle or move its horizontal anchor.
    const outsideX = (radius, sine) => Math.sqrt(Math.max(0, (radius + gap) ** 2 - Math.max(0, (radius + gap) * sine - copyHeight / 2) ** 2));
    let low = 0, high = artWidth;
    for (let pass = 0; pass < 24; pass++) {
      const candidate = (low + high) / 2;
      if (outsideX(candidate * 300 / 640, Math.sin(Math.PI / (2 * count))) + copyWidth <= geometryWidth / 2) low = candidate;
      else high = candidate;
    }
    artWidth = low;
    const radius = artWidth * 300 / 640, centerY = artWidth / 2;
    const positions = copies.map((copy, index) => {
      const height = heights[index];
      const angle = Math.PI + (index + 0.5) * Math.PI / count, cosine = Math.cos(angle);
      const central = Math.abs(cosine) < 0.001;
      const inner = index > 0 && index < count - 1 && !central;
      const offset = Math.max(0, outsideX(radius, -Math.sin(angle)) - (inner ? copyWidth * 0.2 : 0));
      const x = central ? (width - copyWidth) / 2 : width / 2 + (cosine < 0 ? -offset - copyWidth : offset);
      let y = central ? centerY - radius - gap - height : centerY + (radius + gap) * Math.sin(angle) - height / 2;
      const upperPair = inner && (index === count / 2 - 1 || index === count / 2);
      // The top pair shares an edge and keeps its expanded copy above the arc.
      if (upperPair) y = Math.min(y, centerY - radius - gap - Math.max(height, heights[count - 1 - index]));
      else if (inner) y = Math.min(y, centerY - Math.sqrt(Math.max(0, (radius + gap) ** 2 - offset ** 2)) - height);
      return { index, x, y };
    });
    // Move inner labels upwards only when long copy overlaps its outer neighbour.
    // Moving outwards/upwards preserves clearance from the artwork.
    const outerFirst = [...positions].sort((a, b) => Math.abs(b.x + copyWidth / 2 - width / 2) - Math.abs(a.x + copyWidth / 2 - width / 2));
    outerFirst.forEach((position, index) => {
      for (const outer of outerFirst.slice(0, index)) {
        if (position.x < outer.x + copyWidth + gap && position.x + copyWidth + gap > outer.x)
          position.y = Math.min(position.y, outer.y - heights[position.index] - gap);
      }
    });
    const shift = Math.max(0, -Math.min(...positions.map(position => position.y)));
    positions.forEach(({ index, x, y }) => {
      copies[index].style.left = `${x}px`; copies[index].style.top = `${y + shift}px`; copies[index].style.textAlign = 'center';
    });
    art.style.top = `${shift}px`;
    root.style.height = `${shift + Math.max(artWidth * 322 / 640, ...positions.map(position => position.y + heights[position.index]))}px`;
  }
  art.style.width = `${artWidth}px`; art.style.left = `${(width - artWidth) / 2}px`;
  if (expandCopy) expandRadialCopy(root, width, gap);
  return artWidth;
}
