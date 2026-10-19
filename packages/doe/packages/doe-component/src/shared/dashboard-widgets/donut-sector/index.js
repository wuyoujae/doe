import { polar as __doeFn_polar } from '../polar/index.js';
// Origin: public/yrkie-doe/components/dashboard-widgets/dashboard-widgets.js:62


export function donutSector(cx, cy, innerRadius, outerRadius, start, end) {
    const outerStart = (0, __doeFn_polar)(cx, cy, outerRadius, start);
    const outerEnd = (0, __doeFn_polar)(cx, cy, outerRadius, end);
    const innerEnd = (0, __doeFn_polar)(cx, cy, innerRadius, end);
    const innerStart = (0, __doeFn_polar)(cx, cy, innerRadius, start);
    const largeArc = end - start > 180 ? 1 : 0;
    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
      "Z",
    ].join(" ");
  }
