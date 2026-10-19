import { clamp as __doeFn_clamp } from '../../clamp/index.js';
import { element as __doeFn_element } from '../../element/index.js';
import { svgElement as __doeFn_svgElement } from '../../svg-element/index.js';
import { measureText as __doeFn_measureText } from '../../measure-text/index.js';
import { niceScale as __doeFn_niceScale } from '../../nice-scale/index.js';
import { formatValue as __doeFn_formatValue } from '../../format-value/index.js';
import { smoothPath as __doeFn_smoothPath } from '../../smooth-path/index.js';
import { wrapText as __doeFn_wrapText } from '../../wrap-text/index.js';
// Origin: public/yrkie-doe/core/chart-utils.js:152
import { scope as __doeScope } from "../../../../component/charts/shared/runtime/context/index.js";

export function initialize() {
__doeScope.global.PPTChartUtils = {
    clamp: __doeFn_clamp,
    element: __doeFn_element,
    svgElement: __doeFn_svgElement,
    measureText: __doeFn_measureText,
    niceScale: __doeFn_niceScale,
    formatValue: __doeFn_formatValue,
    smoothPath: __doeFn_smoothPath,
    wrapText: __doeFn_wrapText,
  };
}
