import { defaultFormat as __doeFn_defaultFormat } from '../default-format/index.js';
// Origin: public/yrkie-doe/core/chart-utils.js:90


export function formatValue(value, options) {
    return typeof options?.valueFormatter === "function"
      ? options.valueFormatter(value)
      : (0, __doeFn_defaultFormat)(value, options);
  }
