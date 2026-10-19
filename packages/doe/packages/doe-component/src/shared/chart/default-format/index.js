// Origin: public/yrkie-doe/core/chart-utils.js:82


export function defaultFormat(value, options) {
    const settings = options || {};
    const formatted = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: settings.maximumFractionDigits ?? 2,
    }).format(value);
    return `${settings.valuePrefix || ""}${formatted}${settings.valueSuffix || ""}`;
  }
