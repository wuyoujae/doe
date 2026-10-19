import { dataTableHeight as __doeFn_dataTableHeight } from '../../../../registry/library/data-table-height/index.js';
// Origin: layout-engine/library-components.js; preserves definition evaluation and property order.

import { prepareConfig } from '../render/prepare-config/index.js';
import { createItemCollection } from '../layout/item-collection/index.js';
import { createComposition } from '../layout/composition/index.js';
import { createLayoutContract } from '../layout/layout-contract/index.js';
import { validate } from '../schema/validate/index.js';
import { reflow } from '../reflow/index.js';

export function createDefinition() {
  return {
    category: "charts",
    libraryKey: "dataTable",
    defaultSpan: "full",
    minWidth: 480,
    family: "data",
    minHeight: 160,
    measureHeight: __doeFn_dataTableHeight,
    alignSelf: "start",
    rowContentMode: "typography-rebound",
    flowLayout: { layoutRevision: 'table-flow-semantic-v2' },
    reflow,
    prepareConfig,
    itemCollection: createItemCollection(),
    composition: createComposition(),
    layoutContract: createLayoutContract(),
    validate,
  };
}
