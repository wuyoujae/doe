import { compositionRequirements as __doeFn_compositionRequirements } from '../composition-requirements/index.js';
import { ratioWeights as __doeFn_ratioWeights } from '../ratio-weights/index.js';
// Origin: public/yrkie-doe/layout-engine/layout-engine.js:627


export function allocateProportionalWidths(
    totalWidth,
    gap,
    profiles,
    densityId = "comfortable",
    ratio = "auto",
  ) {
    const available = Math.max(0, totalWidth - gap * (profiles.length - 1));
    const requirements = (0, __doeFn_compositionRequirements)(profiles, gap, densityId);
    const { minimums, preferred, minimumScales, requiredWidth } = requirements;
    const weights = (0, __doeFn_ratioWeights)(profiles, ratio);
    const widths = new Array(profiles.length).fill(0);
    const flexible = new Set(profiles.map((_, index) => index));
    let remaining = available;

    while (flexible.size) {
      const preferredTotal = [...flexible].reduce(
        (sum, index) => sum + weights[index],
        0,
      );
      let fixedAny = false;
      [...flexible].forEach((index) => {
        const share = preferredTotal
          ? remaining * (weights[index] / preferredTotal)
          : remaining / flexible.size;
        if (share + 0.5 < minimums[index]) {
          widths[index] = minimums[index];
          remaining -= minimums[index];
          flexible.delete(index);
          fixedAny = true;
        }
      });
      if (remaining < 0) break;
      if (!fixedAny) {
        [...flexible].forEach((index) => {
          widths[index] = preferredTotal
            ? remaining * (weights[index] / preferredTotal)
            : remaining / flexible.size;
        });
        break;
      }
    }

    if (remaining < 0) {
      // The former fallback returned the component minimums verbatim.  When
      // those minimums were wider than the parent, the renderer still wrote
      // them into grid-template-columns, so an "infeasible" plan physically
      // overflowed before the structural solver could choose stack/reflow.
      // Keep the failure signal, but always return tracks that are contained
      // by the real pixel budget.  This is a geometry invariant: an unsafe
      // preference may never become unsafe CSS.
      const pixelBudget = Math.max(0, Math.floor(available));
      const fallbackWidths = new Array(profiles.length).fill(0);
      const base = pixelBudget >= profiles.length ? 1 : 0;
      fallbackWidths.fill(base);
      let distributable = Math.max(
        0,
        pixelBudget - fallbackWidths.reduce((sum, width) => sum + width, 0),
      );
      const weightTotal = minimums.reduce(
        (sum, width) => sum + Math.max(1, width),
        0,
      );
      const remainders = minimums.map((width, index) => {
        const exact = weightTotal
          ? distributable * (Math.max(1, width) / weightTotal)
          : distributable / Math.max(1, minimums.length);
        const whole = Math.floor(exact);
        fallbackWidths[index] += whole;
        return { index, remainder: exact - whole };
      });
      distributable = Math.max(
        0,
        pixelBudget - fallbackWidths.reduce((sum, width) => sum + width, 0),
      );
      remainders
        .sort((a, b) => b.remainder - a.remainder || a.index - b.index)
        .slice(0, distributable)
        .forEach(({ index }) => {
          fallbackWidths[index] += 1;
        });
      return {
        fits: false,
        structuralFits: false,
        widths: fallbackWidths,
        scales: fallbackWidths.map((width, index) =>
          Math.min(1, width / preferred[index]),
        ),
        requiredWidth,
        minimumScales,
      };
    }

    const rounded = widths.map((width) => Math.max(1, Math.floor(width)));
    const roundedTotal = rounded.reduce((sum, width) => sum + width, 0);
    if (rounded.length) {
      rounded[rounded.length - 1] += Math.max(0, Math.floor(available - roundedTotal));
    }
    const scales = rounded.map((width, index) =>
      Math.min(1, width / preferred[index]),
    );
    return {
      fits:
        totalWidth + 0.5 >= requiredWidth &&
        rounded.every((width, index) => width + 0.5 >= minimums[index]),
      structuralFits: true,
      widths: rounded,
      scales,
      requiredWidth,
      minimumScales,
    };
  }
