import { resolveSpacingToken as __doeFn_resolveSpacingToken } from '../resolve-spacing-token/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:7450


export function applySlotSpace(record, compression) {
    const slotSpace = record.node.layout.slotSpace || {};
    const top = (0, __doeFn_resolveSpacingToken)(slotSpace.top, compression, "6pt");
    const right = (0, __doeFn_resolveSpacingToken)(slotSpace.right, compression, "6pt");
    const bottom = (0, __doeFn_resolveSpacingToken)(slotSpace.bottom, compression, "6pt");
    const left = (0, __doeFn_resolveSpacingToken)(slotSpace.left, compression, "6pt");
    record.content.style.padding = `${top}px ${right}px ${bottom}px ${left}px`;
  }
