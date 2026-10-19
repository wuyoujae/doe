// Origin: public/yrkie-doe/components/dashboard-widgets/dashboard-widgets.js:27


export function positiveNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : fallback;
  }
