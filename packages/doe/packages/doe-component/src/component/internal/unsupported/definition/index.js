// Origin: layout-engine/components.js; preserves definition evaluation and property order.

import { createComposition } from '../layout/composition/index.js';
import { createLayoutContract } from '../layout/layout-contract/index.js';
import { render } from '../render/render/index.js';

export function createDefinition() {
  return {
    category: "base",
    defaultSpan: 1,
    minWidth: 280,
    family: "narrative",
    composition: createComposition(),
    layoutContract: createLayoutContract(),
    render,
  };
}
