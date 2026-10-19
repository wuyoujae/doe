import { mountForecastScatter as __doeFn_mountForecastScatter } from '../../mount-forecast-scatter/index.js';
// Origin: public/yrkie-doe/components/business-charts/business-charts.js:464
import { scope as __doeScope } from "../../runtime/context/index.js";

export function initialize() {
__doeScope.library.forecastScatter = { mount: __doeFn_mountForecastScatter };
}
