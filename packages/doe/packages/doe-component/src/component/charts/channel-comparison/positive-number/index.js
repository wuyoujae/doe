// Origin: public/yrkie-doe/components/channel-comparison/channel-comparison.js:14


export function positiveNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : fallback;
  }
