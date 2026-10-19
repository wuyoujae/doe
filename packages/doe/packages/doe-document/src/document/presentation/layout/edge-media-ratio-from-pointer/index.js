import { edgeMediaPosition as __doeFn_edgeMediaPosition } from '../edge-media-position/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:2493


export function edgeMediaRatioFromPointer(record, event) {
    const position = (0, __doeFn_edgeMediaPosition)(record.node);
    const rect = record.content.getBoundingClientRect();
    if (!rect.width || !rect.height) return record.node.layout.mediaRatio;
    if (position === "left") return (event.clientX - rect.left) / rect.width;
    if (position === "right") return (rect.right - event.clientX) / rect.width;
    if (position === "top") return (event.clientY - rect.top) / rect.height;
    return (rect.bottom - event.clientY) / rect.height;
  }
