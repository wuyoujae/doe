import { numberedIconCardsHeight as __doeFn_numberedIconCardsHeight } from '../../../../registry/library/numbered-icon-cards-height/index.js';
// Origin: layout-engine/library-components.js; preserves definition evaluation and property order.

import { createItemCollection } from '../layout/item-collection/index.js';
import { createComposition } from '../layout/composition/index.js';
import { createLayoutContract } from '../layout/layout-contract/index.js';
import { validate } from '../schema/validate/index.js';

export function createDefinition() {
  return {
    category: "contents",
    libraryKey: "numberedIconCards",
    defaultSpan: "full",
    minWidth: 240,
    family: "data",
    minHeight: 220,
    flowLayout: { contentGrid: { grid: '.ppt-numbered-icon-cards__list', item: '.ppt-numbered-icon-cards__item', surface: '.ppt-numbered-icon-cards__surface' } },
    measureHeight: __doeFn_numberedIconCardsHeight,
    itemCollection: createItemCollection(),
    composition: createComposition(),
    layoutContract: createLayoutContract(),
    validate,
  };
}
