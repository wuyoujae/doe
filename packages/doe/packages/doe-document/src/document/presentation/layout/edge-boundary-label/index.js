// Origin: public/yrkie-doe/layout-engine/layout-engine.js:6285


export function edgeBoundaryLabel(rawRatio, bounds) {
    if (rawRatio < bounds.minimum) {
      return `图片最小 ${Math.round(bounds.minimum * 100)}%`;
    }
    if (rawRatio > bounds.maximum) {
      return `图片最大 ${Math.round(bounds.maximum * 100)}%`;
    }
    return "";
  }
