// Origin: layout-engine/library-components.js; preserves definition evaluation and property order.

import { createComposition } from '../layout/composition/index.js';
import { prepareConfig } from '../render/prepare-config/index.js';
import { validate } from '../schema/validate/index.js';
import { textFields } from '../editor/text-fields/index.js';

export function createDefinition() {
  return {
    category: "charts",
    libraryKey: "donutChart",
    defaultSpan: "half",
    minWidth: 390,
    family: "data",
    rowSlotMode: "stretch",
    compressToSafeHeight: true,
    fitToSafeBounds: true,
    safeMinHeight: 180,
    flowLayout: { layoutRevision: 'donut-explicit-legend-v3' },
    omitStandaloneTitle: true,
    composition: createComposition(),
    prepareConfig,
    validate,
    textFields,
  };
}
