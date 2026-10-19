// Origin: public/yrkie-doe/components/grouped-bar-chart/grouped-bar-chart.js:159


export function defaultFormat(value, content) {
    const formatted = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2,
    }).format(value);
    return `${content.valuePrefix || ""}${formatted}${content.valueSuffix || ""}`;
  }
