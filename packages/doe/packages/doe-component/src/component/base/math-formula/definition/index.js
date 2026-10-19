import { mathFormulaHeight as __doeFn_mathFormulaHeight } from '../../../../registry/library/math-formula-height/index.js';
// Origin: layout-engine/library-components.js; preserves definition evaluation and property order.

import { prepareConfig } from '../render/prepare-config/index.js';
import { createComposition } from '../layout/composition/index.js';
import { createLayoutContract } from '../layout/layout-contract/index.js';
import { validate } from '../schema/validate/index.js';

export function createDefinition() {
  return {
    category: "base",
    libraryKey: "mathFormula",
    defaultSpan: "half",
    minWidth: 380,
    family: "data",
    minHeight: 32,
    alignSelf: "start",
    measureHeight: __doeFn_mathFormulaHeight,
    prepareConfig,
    composition: createComposition(),
    layoutContract: createLayoutContract(),
    validate,
  };
}
