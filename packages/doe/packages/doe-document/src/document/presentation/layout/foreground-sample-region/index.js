// Origin: public/yrkie-doe/layout-engine/layout-engine.js:6693


export function foregroundSampleRegion(direction) {
    if (direction === "bottom-right") {
      return { x0: 0.72, x1: 1, y0: 0.72, y1: 1 };
    }
    if (direction === "to-left") return { x0: 0.45, x1: 1, y0: 0, y1: 1 };
    if (direction === "to-bottom") return { x0: 0, x1: 1, y0: 0, y1: 0.55 };
    if (direction === "to-top") return { x0: 0, x1: 1, y0: 0.45, y1: 1 };
    return { x0: 0, x1: 0.55, y0: 0, y1: 1 };
  }
