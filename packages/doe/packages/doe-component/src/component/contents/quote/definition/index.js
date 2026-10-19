// Origin: layout-engine/components.js; preserves definition evaluation and property order.

import { createComposition } from '../layout/composition/index.js';
import { validate } from '../schema/validate/index.js';
import { render } from '../render/render/index.js';

export function createDefinition() {
  return {
    category: "base",
    defaultSpan: 1,
    minWidth: 240,
    family: "narrative",
    composition: createComposition(),
    validate,
    render,
  };
}
