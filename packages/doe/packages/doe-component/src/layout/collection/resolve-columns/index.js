// Origin: public/yrkie-doe/core/contents-layout.js:4


export function resolveColumns(width, requested, count, minimumWidth = 240, gap = 24) {
    const feasible = Math.max(1, Math.floor((width + gap) / (minimumWidth + gap)));
    return Math.max(1, Math.min(count || 1, Math.round(Number(requested) || 3), feasible));
  }
