import { capabilityCardsHeight as __doeFn_capabilityCardsHeight } from '../../../../registry/library/capability-cards-height/index.js';
// Origin: layout-engine/library-components.js; preserves definition evaluation and property order.

import { createItemCollection } from '../layout/item-collection/index.js';
import { createComposition } from '../layout/composition/index.js';
import { createLayoutContract } from '../layout/layout-contract/index.js';
import { validate } from '../schema/validate/index.js';

export function createDefinition() {
  return {
    category: "contents",
    libraryKey: "capabilityCards",
    defaultSpan: "full",
    // One column remains readable at the shared 180pt content floor.
    minWidth: 240,
    family: "data",
    minHeight: 96,
    flowLayout: { contentGrid: { grid: '.ppt-capability-cards__list', item: '.ppt-capability-cards__card', surface: '.ppt-capability-cards__card' } },
    alignSelf: "start",
    measureHeight: __doeFn_capabilityCardsHeight,
    itemCollection: createItemCollection(),
    composition: createComposition(),
    layoutContract: createLayoutContract(),
    validate,
  };
}
