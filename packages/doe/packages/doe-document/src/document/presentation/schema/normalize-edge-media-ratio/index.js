import { edgeMediaBounds as __doeFn_edgeMediaBounds } from '../../layout/edge-media-bounds/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:756


export function normalizeEdgeMediaRatio(value, position) {
    const bounds = (0, __doeFn_edgeMediaBounds)(position);
    const numeric = Number(value);
    const resolved = Number.isFinite(numeric) ? numeric : bounds.defaultValue;
    return Math.max(bounds.minimum, Math.min(bounds.maximum, resolved));
  }
