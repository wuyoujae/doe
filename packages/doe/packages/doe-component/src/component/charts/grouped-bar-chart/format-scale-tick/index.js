import { formatValue as __doeFn_formatValue } from '../format-value/index.js';
// Origin: public/yrkie-doe/components/grouped-bar-chart/grouped-bar-chart.js:172


export function formatScaleTick(value, content, scaleMode) {
    if (scaleMode === "series-index") {
      return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 0,
      }).format(value);
    }
    return (0, __doeFn_formatValue)(value, content);
  }
