import { paintedRectForShell as __doeFn_paintedRectForShell } from '../painted-rect-for-shell/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:8057


export function countOverlaps(siblingSets) {
    let overlaps = 0;
    siblingSets.forEach((siblings) => {
      for (let i = 0; i < siblings.length; i += 1) {
        const a = (0, __doeFn_paintedRectForShell)(siblings[i]);
        for (let j = i + 1; j < siblings.length; j += 1) {
          const b = (0, __doeFn_paintedRectForShell)(siblings[j]);
          const intersectionWidth = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const intersectionHeight = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (intersectionWidth > 0.5 && intersectionHeight > 0.5) overlaps += 1;
        }
      }
    });
    return overlaps;
  }
