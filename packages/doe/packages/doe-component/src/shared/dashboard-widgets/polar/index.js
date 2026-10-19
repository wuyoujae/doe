// Origin: public/yrkie-doe/components/dashboard-widgets/dashboard-widgets.js:57


export function polar(cx, cy, radius, degrees) {
    const radians = ((degrees - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
  }
