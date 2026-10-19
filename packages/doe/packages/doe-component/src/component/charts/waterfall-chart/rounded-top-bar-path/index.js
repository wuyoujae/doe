// Origin: public/yrkie-doe/components/waterfall-chart/waterfall-chart.js:94


export function roundedTopBarPath(x, y, width, height, radius) {
    const right = x + width;
    const bottom = y + height;
    const resolvedRadius = Math.max(
      0,
      Math.min(radius, width / 2, height)
    );
    return [
      `M ${x} ${bottom}`,
      `L ${x} ${y + resolvedRadius}`,
      `A ${resolvedRadius} ${resolvedRadius} 0 0 1 ${x + resolvedRadius} ${y}`,
      `H ${right - resolvedRadius}`,
      `A ${resolvedRadius} ${resolvedRadius} 0 0 1 ${right} ${y + resolvedRadius}`,
      `V ${bottom}`,
      "Z",
    ].join(" ");
  }
