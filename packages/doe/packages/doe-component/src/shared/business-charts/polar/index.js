// Origin: public/yrkie-doe/components/business-charts/business-charts.js:459


export function polar(cx, cy, radius, degrees) {
    const radians = ((degrees - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
  }
