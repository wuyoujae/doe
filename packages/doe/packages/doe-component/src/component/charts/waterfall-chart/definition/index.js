// Origin: layout-engine/library-components.js; preserves definition evaluation and property order.

import { createComposition } from '../layout/composition/index.js';
import { validate } from '../schema/validate/index.js';
import { prepareConfig } from '../render/prepare-config/index.js';

export function createDefinition() {
  return {
    category: "charts",
    libraryKey: "waterfallChart",
    defaultSpan: "full",
    minWidth: 720,
    family: "data",
    rowSlotMode: "stretch",
    compressToSafeHeight: true,
    safeMinHeight: 270,
    omitStandaloneTitle: true,
    composition: createComposition(),
    validate,
    prepareConfig,
  };
}
