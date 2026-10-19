

export function visibleSlideBounds(slide: HTMLElement, inset: number) {
  const rect = slide.getBoundingClientRect();
  const view = slide.ownerDocument.defaultView!;
  const left = Math.max(0, rect.left) + inset;
  const top = Math.max(0, rect.top) + inset;
  const right = Math.max(left, Math.min(view.innerWidth, rect.right) - inset);
  const bottom = Math.max(top, Math.min(view.innerHeight, rect.bottom) - inset);
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}
