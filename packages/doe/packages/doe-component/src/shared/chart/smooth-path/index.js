// Origin: public/yrkie-doe/core/chart-utils.js:96


export function smoothPath(points, smoothing) {
    if (!points.length) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    if (smoothing === false) {
      return points
        .map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`)
        .join(" ");
    }

    const tension = typeof smoothing === "number" ? smoothing : 0.9;
    let path = `M ${points[0].x} ${points[0].y}`;

    for (let index = 0; index < points.length - 1; index += 1) {
      const previous = points[index - 1] || points[index];
      const current = points[index];
      const next = points[index + 1];
      const afterNext = points[index + 2] || next;
      const control1 = {
        x: current.x + ((next.x - previous.x) / 6) * tension,
        y: current.y + ((next.y - previous.y) / 6) * tension,
      };
      const control2 = {
        x: next.x - ((afterNext.x - current.x) / 6) * tension,
        y: next.y - ((afterNext.y - current.y) / 6) * tension,
      };
      path += ` C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${next.x} ${next.y}`;
    }

    return path;
  }
