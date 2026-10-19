// Origin: public/yrkie-doe/layout-engine/layout-engine.js:6636


export function relativeLuminance(red, green, blue) {
    const channel = (value) => {
      const normalized = value / 255;
      return normalized <= 0.04045
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
    };
    return (
      0.2126 * channel(red) +
      0.7152 * channel(green) +
      0.0722 * channel(blue)
    );
  }
