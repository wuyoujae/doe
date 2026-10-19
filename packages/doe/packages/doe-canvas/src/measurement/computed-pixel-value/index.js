// Origin: public/yrkie-doe/layout-engine/layout-engine.js:8161


export function computedPixelValue(node, property) {
    const value = Number.parseFloat(getComputedStyle(node)[property]);
    return Number.isFinite(value) ? value : 0;
  }
