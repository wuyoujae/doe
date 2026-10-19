import { clamp as __doeFn_clamp } from '../clamp/index.js';
// Origin: public/yrkie-doe/components/grouped-bar-chart/grouped-bar-chart.js:280


export function placeValueLabels(labels, width, height) {
    const placed = [];
    labels.forEach(label => {
      const x = (0, __doeFn_clamp)(label.x, label.width / 2, Math.max(label.width / 2, width - label.width / 2));
      let bottom = label.fraction * height + 5;
      for (let pass = 0; pass <= placed.length; pass++) {
        const collisions = placed.filter(other => Math.abs(x - other.x) < (label.width + other.width) / 2 + 5
          && bottom < other.bottom + other.height + 4 && bottom + label.height + 4 > other.bottom);
        if (!collisions.length) break;
        bottom = Math.max(...collisions.map(other => other.bottom + other.height + 4));
      }
      placed.push({ ...label, x, bottom });
    });
    return placed;
  }
