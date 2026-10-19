// A scrolling share page uses a tall iframe; only its intersection with the
// parent viewport is visible. Keep the card inside that visible intersection.
export function visibleViewport(view) {
  const viewport = view.visualViewport;
  let left = viewport?.offsetLeft || 0, top = viewport?.offsetTop || 0;
  let right = left + (viewport?.width || view.innerWidth), bottom = top + (viewport?.height || view.innerHeight);
  try {
    const frame = view.frameElement;
    if (frame) {
      const parent = visibleViewport(view.parent), rect = frame.getBoundingClientRect();
      const sx = rect.width / (frame.offsetWidth || rect.width), sy = rect.height / (frame.offsetHeight || rect.height);
      const x = rect.left + frame.clientLeft * sx, y = rect.top + frame.clientTop * sy;
      if (sx > 0 && sy > 0) {
        left = Math.max(left, (parent.left - x) / sx); top = Math.max(top, (parent.top - y) / sy);
        right = Math.min(right, (parent.right - x) / sx); bottom = Math.min(bottom, (parent.bottom - y) / sy);
      }
    }
  } catch { /* A cross-origin embed retains its own viewport bounds. */ }
  return { left, top, right, bottom };
}
