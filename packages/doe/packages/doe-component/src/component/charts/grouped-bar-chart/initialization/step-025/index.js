import { mount as __doeFn_mount } from '../../mount/index.js';
import { placeValueLabels as __doeFn_placeValueLabels } from '../../place-value-labels/index.js';
// Origin: public/yrkie-doe/components/grouped-bar-chart/grouped-bar-chart.js:520
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.library.groupedBarChart = { mount: __doeFn_mount, placeValueLabels: __doeFn_placeValueLabels };
}
