// Origin: public/yrkie-doe/core/chart-utils.js:36


export function niceStep(span, targetTicks) {
    if (span <= 0) return 1;
    const roughStep = span / Math.max(2, targetTicks || 5);
    const magnitude = 10 ** Math.floor(Math.log10(roughStep));
    const normalized = roughStep / magnitude;
    let niceNormalized;

    if (normalized <= 1) niceNormalized = 1;
    else if (normalized <= 2) niceNormalized = 2;
    else if (normalized <= 2.5) niceNormalized = 2.5;
    else if (normalized <= 5) niceNormalized = 5;
    else niceNormalized = 10;

    return niceNormalized * magnitude;
  }
