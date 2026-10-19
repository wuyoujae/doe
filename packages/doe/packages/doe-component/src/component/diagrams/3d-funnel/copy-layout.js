import { FUNNEL, funnelSize } from './geometry.js';
import { measureCopy, boundedCopyHeight } from '../../../layout/flow/copy-bounds.js';

export function layoutCopies(root, sections, context) {
  const size = funnelSize(sections.length);
  const width = Math.max(size.width, context.flowLayout ? context.slotWidth ?? context.width : Math.max(FUNNEL.width, context.width)), offset = (width - size.width) / 2;
  if (context.flowLayout) root.style.width = `${width}px`;
  const copies = [...root.querySelectorAll('.diagram-3d-funnel__copy')], gap = 16;
  const slots = [];
  copies.forEach((copy, index) => {
    const section = sections[index], previous = sections[index - 1], next = sections[index + 1];
    const left = previous ? offset + (previous.center + section.center) / 2 + gap / 2 : 0;
    const right = next ? offset + (section.center + next.center) / 2 - gap / 2 : width;
    const center = offset + section.center, halfWidth = Math.min(center - left, right - center);
    const top = section.bottom + 20;
    Object.assign(copy.style, { left: `${center - halfWidth}px`, top: `${top}px`, width: `${halfWidth * 2}px` });
    slots.push({ copy, top });
  });
  root.querySelector('svg').style.left = `${offset}px`;
  root.ownerDocument.defaultView.SemanticTextLayout?.applyTree(root, { allowScale: false });
  let height = size.height;
  for (const { copy, top } of slots) {
    const bounds = measureCopy(copy, [...copy.querySelectorAll('.diagram-3d-funnel__title,.diagram-3d-funnel__text')]);
    const available = Number.isFinite(context.contentHeightBudget) ? context.contentHeightBudget - top : bounds.limit;
    const capacity = boundedCopyHeight(bounds, Math.max(Math.min(bounds.minimum, bounds.maximum), available));
    copy.style.height = `${capacity}px`;
    height = Math.max(height, top + capacity);
  }
  root.style.height = `${Math.ceil(height)}px`;
}
