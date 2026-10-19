import { COPY_BOUNDS, copyMinimumWidth, measureCopy, packCopy, copyCapacities, boundedCopyHeight } from '../../../layout/flow/copy-bounds.js';
import { toPixels } from '../../../layout/flow/contract.js';
import { artBoundary } from './art-boundary.js';

/** Reflow external callouts inside the actual column, keeping native artwork. */
export function layoutDiagramCopy(root, geometry, context, width, offset) {
  const { slots, svg } = geometry, art = svg.getBBox(), gap = toPixels(COPY_BOUNDS.gapPt);
  const sideSlots = slots.filter(slot => slot.expand);
  const both = sideSlots.some(slot => slot.expand === 'left') && sideSlots.some(slot => slot.expand === 'right');
  const slotWidth = context.slotWidth ?? width;
  const frameLeft = both ? (width - slotWidth) / 2 : sideSlots[0]?.expand === 'left'
    ? art.x + art.width + offset + 2 - slotWidth : Math.max(0, art.x + offset - 2);
  const frameRight = frameLeft + slotWidth;
  const items = slots.map((slot, index) => {
    const copy = root.querySelector(`[data-collection-item-index="${index}"]`);
    const fields = [...copy.querySelectorAll('.doe-diagram__title,.doe-diagram__text')];
    if (slot.expand) {
      const minimum = copyMinimumWidth(root, fields.at(-1));
      const right = slot.x + slot.w + offset;
      const maximum = slot.expand === 'left' ? right - Math.max(0, frameLeft) : frameRight - slot.x - offset;
      const w = Math.max(minimum, Math.min(slot.w + offset, maximum));
      Object.assign(copy.style, { width: `${w}px`, left: `${slot.expand === 'left' ? right - w : slot.x + offset}px` });
      copy.dataset.copyWidthConflict = String(maximum < minimum);
    }
    return { slot, copy, fields, index };
  });
  if (sideSlots.length) geometry.copyBoundary ||= artBoundary(svg);
  // Each retry only narrows a text box or moves its edge away from artwork.
  // Width, height and anchors are rebuilt from source on the next reflow.
  let height, artTop;
  for (let pass = 0; pass < 16; pass++) {
    root.ownerDocument.defaultView.SemanticTextLayout?.applyTree(root, { allowScale: false });
    items.forEach(item => {
      item.bounds = measureCopy(item.copy, item.fields);
      // In-shape copy keeps its native enclosure. Outside copy may grow.
      item.height = item.slot.expand ? item.bounds.height : Math.min(item.slot.h, Math.ceil(item.bounds.demand));
      item.copy.style.height = `${item.height}px`;
    });
    const groups = ['left', 'right'].map(side => items.filter(item => item.slot.expand === side).sort((a, b) => a.slot.y - b.slot.y));
    const required = Math.max(0, ...groups.map(group => group.reduce((sum, item) => sum + item.height, 0) + Math.max(0, group.length - 1) * gap));
    const budget = Math.max(geometry.height, context.contentHeightBudget ?? geometry.height);
    height = Math.max(geometry.height, Math.min(budget, required));
    artTop = (height - geometry.height) / 2;
    root.style.height = `${height}px`; svg.style.top = `${artTop}px`;
    for (const group of groups) {
      const capacities = copyCapacities(group.map(item => item.height), height - Math.max(0, group.length - 1) * gap)
        .map((capacity, index) => boundedCopyHeight(group[index].bounds, capacity));
      const preferred = group.map((item, index) => artTop + item.slot.y +
        (item.slot.alignY === 'center' ? (item.slot.h - capacities[index]) / 2 : item.slot.alignY === 'bottom' ? item.slot.h - capacities[index] : 0));
      const { positions } = packCopy(capacities, preferred, height, gap);
      group.forEach((item, index) => {
        item.height = capacities[index];
        Object.assign(item.copy.style, { top: `${positions[index]}px`, height: `${item.height}px` });
      });
    }
    let changed = false;
    for (const item of items.filter(item => item.slot.expand)) {
      const { copy, slot, fields } = item, top = parseFloat(copy.style.top) - artTop;
      // A finite fallback leaves the entire artwork envelope clear. The last
      // pass remeasures that conservative box, so no stale dimensions escape.
      const edge = pass >= 14 ? { left: art.x - 1, right: art.x + art.width + 1 }
        : geometry.copyBoundary(top - gap, top + item.height + gap);
      const minimum = copyMinimumWidth(root, fields.at(-1));
      const left = parseFloat(copy.style.left), w = parseFloat(copy.style.width), right = left + w;
      const nextLeft = slot.expand === 'right' ? Math.max(left, edge.right + offset + gap) : left;
      const nextRight = slot.expand === 'left' ? Math.min(right, edge.left + offset - gap) : right;
      if (nextLeft > left + 1 / 64 || nextRight < right - 1 / 64) {
        const nextWidth = Math.max(minimum, nextRight - nextLeft);
        Object.assign(copy.style, { left: `${slot.expand === 'left' ? nextRight - nextWidth : nextLeft}px`, width: `${nextWidth}px` });
        changed = true;
      }
    }
    if (!changed) break;
  }
  for (const { copy, slot, height: h } of items) {
    if (!slot.expand) copy.style.top = `${slot.y + artTop + (slot.alignY === 'center' ? (slot.h - h) / 2 : slot.alignY === 'bottom' ? slot.h - h : 0)}px`;
    // Icons belong to the fixed artwork, not to the moving text box.
    if (slot.icon) Object.assign(copy.querySelector('.doe-diagram__icon').style, {
      left: `${slot.icon.x + offset - parseFloat(copy.style.left)}px`, top: `${slot.icon.y + artTop - parseFloat(copy.style.top)}px`,
    });
  }
}
