import { rowSize as __doeFn_rowSize } from '../row-size/index.js';
// Origin: public/yrkie-doe/core/contents-layout.js:23


export function gridPlan(count, columns) {
    const remainder = count % columns;
    const tracks = remainder ? columns * remainder : columns;
    return { tracks, spans: Array.from({ length: count }, (_, index) => tracks / (0, __doeFn_rowSize)(count, columns, index)) };
  }
