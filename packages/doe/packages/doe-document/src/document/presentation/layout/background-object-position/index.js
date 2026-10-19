// Origin: public/yrkie-doe/layout-engine/layout-engine.js:6650


export function backgroundObjectPosition(value) {
    const keywords = {
      left: 0,
      top: 0,
      center: 0.5,
      right: 1,
      bottom: 1,
    };
    const parts = String(value || "50% 50%")
      .trim()
      .split(/\s+/)
      .slice(0, 2);
    const parsePart = (part, fallback) => {
      const normalized = String(part || "").toLowerCase();
      if (Object.prototype.hasOwnProperty.call(keywords, normalized)) {
        return keywords[normalized];
      }
      const percent = normalized.match(/^(-?\d+(?:\.\d+)?)%$/);
      return percent ? Number(percent[1]) / 100 : fallback;
    };
    return [parsePart(parts[0], 0.5), parsePart(parts[1], 0.5)];
  }
