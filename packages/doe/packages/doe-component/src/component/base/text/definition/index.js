// Origin: layout-engine/components.js; preserves definition evaluation and property order.

import { createComposition } from '../layout/composition/index.js';
import { createLayoutContract } from '../layout/layout-contract/index.js';
import { validate } from '../schema/validate/index.js';
import { render } from '../render/render/index.js';

export function createDefinition() {
  return {
    category: "base",
    columnMinWidth: 240,
    defaultSpan: 1,
    minWidth: 360,
    family: "narrative",
    composition: createComposition(),
    layoutContract: createLayoutContract(),
    collection: {
      key: "narrative-text",
      minItemWidth: 340,
      preferredItemWidth: 500,
      maxColumns: 2,
      maxItems: 8,
    },
    validate,
    render,
  };
}
