import { findLocation as __doeFn_findLocation } from '../../../../../../doe-core/src/operation/find-location/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:2964


export function compositionGroupId(state, sourceId, targetId) {
    const base = `composition-${targetId}-${sourceId}`
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 72);
    let candidate = base;
    let suffix = 2;
    while ((0, __doeFn_findLocation)(state.slide.blocks, candidate)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }
