import { validateSeries as __doeFn_validateSeries } from '../../../../../registry/library/validate-series/index.js';
import { warnStandaloneTitle as __doeFn_warnStandaloneTitle } from '../../../../../registry/library/warn-standalone-title/index.js';
// Origin: layout-engine/library-components.js; grouped-bar-chart.validate


export function validate(props, warnings) {
      (0, __doeFn_validateSeries)(props, warnings, "grouped-bar-chart");
      (0, __doeFn_warnStandaloneTitle)(props, warnings, "grouped-bar-chart");
    }
