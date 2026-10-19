import { mountStackedArea as __doeFn_mountStackedArea } from '../../mount-stacked-area/index.js';
// Origin: public/yrkie-doe/components/business-charts/business-charts.js:467
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.library.stackedAreaChart = { mount: __doeFn_mountStackedArea };
}
