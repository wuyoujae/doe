// Origin: layout-engine/library-components.js; preserves definition evaluation and property order.

import { createComposition } from '../layout/composition/index.js';
import { validate } from '../schema/validate/index.js';
import { prepareConfig } from '../render/prepare-config/index.js';

export function createDefinition() {
  return {
    category: "charts",
    libraryKey: "lineChart",
    defaultSpan: "half",
    minWidth: 500,
    family: "data",
    rowSlotMode: "stretch",
    compressToSafeHeight: true,
    safeMinHeight: 240,
    flowLayout: { layoutRevision: 'line-chart-unscaled-labels-v2' },
    omitStandaloneTitle: true,
    composition: createComposition(),
    validate,
    prepareConfig,
  };
}
