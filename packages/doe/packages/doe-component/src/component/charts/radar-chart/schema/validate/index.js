import { warnStandaloneTitle as __doeFn_warnStandaloneTitle } from '../../../../../registry/library/warn-standalone-title/index.js';
import { hasArray as __doeFn_hasArray } from '../../../../../registry/library/has-array/index.js';
// Origin: layout-engine/library-components.js; radar-chart.validate


export function validate(props, warnings) {
      (0, __doeFn_warnStandaloneTitle)(props, warnings, "radar-chart");
      const axes = props.content?.axes;
      const datasets = props.content?.datasets;
      if (!Array.isArray(axes) || axes.length < 3) {
        warnings.push("radar-chart.content.axes requires at least 3 axes.");
      }
      if (!(0, __doeFn_hasArray)(datasets)) {
        warnings.push("radar-chart.content.datasets must contain data.");
      }
      (datasets || []).forEach((dataset, index) => {
        if (!Array.isArray(dataset?.values) || dataset.values.length !== axes?.length) {
          warnings.push(`radar-chart.content.datasets[${index}].values must match axes length.`);
        }
      });
    }
