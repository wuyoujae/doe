// Origin: layout-engine/components.js; preserves definition evaluation and property order.

import { createComposition } from '../layout/composition/index.js';
import { createLayoutContract } from '../layout/layout-contract/index.js';
import { validate } from '../schema/validate/index.js';
import { render } from '../render/render/index.js';

export function createDefinition() {
  return {
    category: "contents",
    defaultSpan: 1,
    minWidth: 300,
    family: "metric",
    composition: createComposition(),
    layoutContract: createLayoutContract(),
    collection: {
      key: "kpi",
      minItemWidth: 280,
      preferredItemWidth: 420,
      maxColumns: 3,
      maxItems: 16,
    },
    validate,
    render,
  };
}
