// Origin: public/yrkie-doe/layout-engine/layout-engine.js:6673


export function backgroundOverlayAlpha(background, x, y) {
    const opacity = Math.max(
      0,
      Math.min(0.9, Number(background.overlay?.opacity) || 0),
    );
    const direction = background.overlay?.direction || "to-right";
    const progress =
      direction === "to-left"
        ? 1 - x
        : direction === "to-bottom"
          ? y
          : direction === "to-top"
            ? 1 - y
            : x;
    if (progress <= 0.54) {
      return opacity * (1 - (progress / 0.54) * 0.32);
    }
    return opacity * 0.68 * (1 - (progress - 0.54) / 0.46);
  }
