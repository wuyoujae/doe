// Origin: layout-engine/components.js; preserves definition evaluation and property order.

import { createComposition } from '../layout/composition/index.js';
import { createLayoutContract } from '../layout/layout-contract/index.js';
import { createItemCollection } from '../layout/item-collection/index.js';
import { validate } from '../schema/validate/index.js';
import { render } from '../render/render/index.js';
import { adapt } from '../render/adapt/index.js';

export function createDefinition() {
  return {
    category: "base",
    columnMinWidth: 240,
    defaultSpan: 1,
    minWidth: 390,
    family: "narrative",
    composition: createComposition(),
    layoutContract: createLayoutContract(),
    collection: {
      key: "narrative-list",
      minItemWidth: 360,
      preferredItemWidth: 540,
      maxColumns: 2,
      maxItems: 8,
    },
    itemCollection: createItemCollection(),
    validate,
    render,
    adapt,
  };
}
