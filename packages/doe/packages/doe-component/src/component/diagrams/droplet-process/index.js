import { WIDTH, art, add, marker } from '../shared/svg.js';
import { DROPLET_SEAM, ROUND_BADGE_RADIUS } from '../shared/badge-geometry.js';

export const config = {
  type: 'droplet-process', artIcons: true, iconFallback: 'Droplet', min: 1, max: 5,
  geometry(document, props) {
    const count = props.items.length, gap = DROPLET_SEAM;
    // A round badge with its square corner rotated 45 degrees forms the tip.
    // Reserve a fixed diagonal seam instead of distributing items across a row.
    const radius = ROUND_BADGE_RADIUS;
    const step = 2 * radius + gap, corner = radius / Math.SQRT2;
    const rowWidth = (count - 1) * step + (1 + Math.SQRT2) * radius;
    const start = (WIDTH - rowWidth) / 2;
    const height = radius * 2 + 184, svg = art(document, height), slots = [];
    for (let i = 0; i < count; i++) {
      const cx = start + i * step + radius, cy = radius;
      // Intersect the next circle with the preceding tip's parallel edges.
      // The offset along x is sqrt(2) times the perpendicular seam width.
      const inset = step - Math.SQRT2 * radius - Math.SQRT2 * gap;
      const cutY = (Math.sqrt(2 * radius * radius - inset * inset) - inset) / 2;
      const cutX = cx - inset - cutY;
      const tail = i === 0
        ? `A ${radius} ${radius} 0 1 1 ${cx + corner} ${cy - corner}`
        : `A ${radius} ${radius} 0 0 1 ${cutX} ${cy + cutY} L ${cx - inset} ${cy} L ${cutX} ${cy - cutY} A ${radius} ${radius} 0 0 1 ${cx + corner} ${cy - corner}`;
      add(svg, 'path', { class: 'doe-droplet__shape', d: `M ${cx + corner} ${cy - corner} L ${cx + Math.SQRT2 * radius} ${cy} L ${cx + corner} ${cy + corner} ${tail} Z`, fill: 'var(--yrkie-color-primary)' });
      marker(svg, cx, cy, i).style.setProperty('color', 'var(--yrkie-color-on-primary)');
      slots.push({ x: cx - radius + 8, y: radius * 2 + 24, w: radius * 2 - 16, h: 160, align: 'center' });
    }
    return { svg, height, slots };
  },
};
