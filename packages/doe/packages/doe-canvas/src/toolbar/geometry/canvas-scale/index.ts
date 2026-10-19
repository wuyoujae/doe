

export function canvasScale(anchor: HTMLElement): number {
  const slide = anchor.closest<HTMLElement>('.schema-slide');
  if (!slide) return 1;
  const rect = slide.getBoundingClientRect();
  return rect.width > 0 && slide.offsetWidth > 0 ? rect.width / slide.offsetWidth : 1;
}
