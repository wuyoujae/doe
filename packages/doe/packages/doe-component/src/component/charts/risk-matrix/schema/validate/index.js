import { validateItems as __doeFn_validateItems } from '../../../../../registry/library/validate-items/index.js';
import { warnStandaloneTitle as __doeFn_warnStandaloneTitle } from '../../../../../registry/library/warn-standalone-title/index.js';
// Origin: layout-engine/library-components.js; risk-matrix.validate


export function validate(props, warnings) {
      (0, __doeFn_validateItems)(props, warnings, "risk-matrix");
      (0, __doeFn_warnStandaloneTitle)(props, warnings, "risk-matrix");
    }
