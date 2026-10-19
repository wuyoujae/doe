// Origin: layout-engine/components.js; preserves definition evaluation and property order.

import { createComposition } from '../layout/composition/index.js';
import { createLayoutContract } from '../layout/layout-contract/index.js';
import { validate } from '../schema/validate/index.js';
import { render } from '../render/render/index.js';

export function createDefinition() {
  return {
    category: "base",
    // Code owns a filled surface like charts and tables. In a horizontal
    // composition it fills the row assigned by the group while its internal
    // grid keeps the first line anchored to the top.
    rowSlotMode: "stretch",
    defaultSpan: "full",
    minWidth: 300,
    family: "data",
    composition: createComposition(),
    layoutContract: createLayoutContract(),
    validate,
    render,
  };
}
