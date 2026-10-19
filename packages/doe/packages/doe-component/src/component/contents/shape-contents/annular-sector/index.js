/** Parallel offsets keep the radial cut at a constant physical width. */
export function annularSector(cx, cy, outer, inner, startAngle, endAngle, halfGap = 4, corner = 5) {
  const point = (radius, angle) => `${cx + radius * Math.cos(angle)} ${cy + radius * Math.sin(angle)}`;
  const start = radius => startAngle + Math.asin(halfGap / radius);
  const end = radius => endAngle - Math.asin(halfGap / radius);
  return `M${point(outer, start(outer) + corner / outer)}
    A${outer} ${outer} 0 0 1 ${point(outer, end(outer) - corner / outer)}
    Q${point(outer, end(outer))} ${point(outer - corner, end(outer - corner))}
    L${point(inner + corner, end(inner + corner))}
    Q${point(inner, end(inner))} ${point(inner, end(inner) - corner / inner)}
    A${inner} ${inner} 0 0 0 ${point(inner, start(inner) + corner / inner)}
    Q${point(inner, start(inner))} ${point(inner + corner, start(inner + corner))}
    L${point(outer - corner, start(outer - corner))}
    Q${point(outer, start(outer))} ${point(outer, start(outer) + corner / outer)} Z`;
}
