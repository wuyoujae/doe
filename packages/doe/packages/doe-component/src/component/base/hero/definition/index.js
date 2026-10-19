// Origin: layout-engine/components.js; preserves definition evaluation and property order.

import { createComposition } from '../layout/composition/index.js';
import { createLayoutContract } from '../layout/layout-contract/index.js';
import { createSlotSpace } from '../layout/slot-space/index.js';
import { validate } from '../schema/validate/index.js';
import { render } from '../render/render/index.js';

export function createDefinition() {
  return {
    category: "base",
    defaultSpan: "full",
    // Hero is commonly used inside an edge-media content region. 720px is a
    // comfortable line length, not a hard safety floor: on a 960pt slide a
    // 45% bleed panel leaves about 704 CSS pixels for content. Treating the
    // preferred width as the minimum made an otherwise valid cover page fail.
    minWidth: 360,
    composition: createComposition(),
    layoutContract: createLayoutContract(),
    slotSpace: createSlotSpace(),
    validate,
    render,
  };
}
