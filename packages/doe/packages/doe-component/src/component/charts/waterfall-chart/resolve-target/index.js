// Origin: public/yrkie-doe/components/waterfall-chart/waterfall-chart.js:37


export function resolveTarget(target) {
    return typeof target === "string" ? document.querySelector(target) : target;
  }
