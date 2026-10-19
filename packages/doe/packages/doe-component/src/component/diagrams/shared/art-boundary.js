/** Conservative horizontal envelopes of native filled artwork, in SVG units.
 * Cached geometry never includes editor controls, connector strokes or defs.
 * One-unit samples plus a one-unit guard cover curves between sample points. */
export function artBoundary(svg) {
  const bands = new Map(), inverse = svg.getScreenCTM().inverse();
  for (const shape of svg.querySelectorAll('path,ellipse,circle,polygon,rect')) {
    if (shape.closest('defs') || getComputedStyle(shape).fill === 'none' || !shape.getTotalLength) continue;
    const matrix = inverse.multiply(shape.getScreenCTM());
    const length = shape.getTotalLength();
    const steps = Math.ceil(length * Math.max(Math.hypot(matrix.a, matrix.b), Math.hypot(matrix.c, matrix.d)));
    for (let i = 0; i <= steps; i++) {
      const point = shape.getPointAtLength(steps ? length * i / steps : 0).matrixTransform(matrix);
      for (let y = Math.floor(point.y) - 1; y <= Math.ceil(point.y) + 1; y++) {
        const band = bands.get(y) || { left: Infinity, right: -Infinity };
        band.left = Math.min(band.left, point.x - 1); band.right = Math.max(band.right, point.x + 1);
        bands.set(y, band);
      }
    }
  }
  return (top, bottom) => {
    let left = Infinity, right = -Infinity;
    for (let y = Math.floor(top); y <= Math.ceil(bottom); y++) {
      const band = bands.get(y);
      if (band) { left = Math.min(left, band.left); right = Math.max(right, band.right); }
    }
    return { left, right };
  };
}
