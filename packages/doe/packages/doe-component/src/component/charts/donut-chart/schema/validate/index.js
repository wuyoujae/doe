import { warnStandaloneTitle as __doeFn_warnStandaloneTitle } from '../../../../../registry/library/warn-standalone-title/index.js';
// Origin: layout-engine/library-components.js; donut-chart.validate


export function validate(props, warnings) {
      (0, __doeFn_warnStandaloneTitle)(props, warnings, "donut-chart");
      const items = props.content?.items;
      if (!Array.isArray(items) || items.length < 2) {
        warnings.push("donut-chart.content.items requires at least 2 items.");
      }
      if ((items || []).every((item) => !(Number(item?.value) > 0))) {
        warnings.push("donut-chart requires at least one positive item value.");
      }
      if (props.subtitle) {
        warnings.push("donut-chart.subtitle is unsupported; use a separate text node.");
      }
    }
