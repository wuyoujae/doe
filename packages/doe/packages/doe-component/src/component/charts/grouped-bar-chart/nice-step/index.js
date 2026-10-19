// Origin: public/yrkie-doe/components/grouped-bar-chart/grouped-bar-chart.js:51


export function niceStep(maxValue) {
    if (maxValue <= 0) return 1;

    const roughStep = maxValue / 5;
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
