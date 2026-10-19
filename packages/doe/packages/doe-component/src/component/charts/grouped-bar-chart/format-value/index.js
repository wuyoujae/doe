import { defaultFormat as __doeFn_defaultFormat } from '../default-format/index.js';
// Origin: public/yrkie-doe/components/grouped-bar-chart/grouped-bar-chart.js:166


export function formatValue(value, content) {
    return typeof content.valueFormatter === "function"
      ? content.valueFormatter(value)
      : (0, __doeFn_defaultFormat)(value, content);
  }
