import { runSteps } from './steps.js';

/** Find the largest measured fitting ratio; every accepted value was tested. */
export function fitContinuousText(...args) { return runSteps(fitContinuousTextSteps(...args)); }
export function* fitContinuousTextSteps(peers, current, measure, minimumRatio = 0) {
  const minimum = Math.max(minimumRatio, ...peers.map(field => field.ladder.at(-1) / field.basePt));
  const upper = Math.max(minimum, Math.min(1, current));
  if ((yield () => measure(upper))) return { ratio: upper, fits: true };
  if (!(yield () => measure(minimum))) return { ratio: minimum, fits: false };
  let low = minimum, high = upper;
  const largestFont = Math.max(...peers.map(field => field.basePt));
  // Browser line wrapping is discrete. Search the actual layout, not character counts.
  for (let pass = 0; pass < 16 && (high - low) * largestFont > .01; pass++) {
    const ratio = (low + high) / 2;
    if ((yield () => measure(ratio))) low = ratio;
    else high = ratio;
  }
  return { ratio: low, fits: (yield () => measure(low)) };
}

/** A persisted group cannot split title/body ratios or bypass today's font floor. */
export function setItemTextRatio(plan, peers, requested) {
  const ratio = Math.min(1, Math.max(requested, ...peers.map(field => field.ladder.at(-1) / field.basePt)));
  for (const field of peers) {
    if (ratio < 1) plan.textRatio[field.key] = ratio;
    else delete plan.textRatio[field.key];
  }
  return ratio;
}

/** CSS computed sizes have rounding noise; use one stable pt value in every layer. */
export function continuousFontPt(base, ratio, floor) {
  const canonical = Math.round(base * 1000) / 1000;
  return Math.max(Math.min(floor, canonical), Math.floor(canonical * ratio * 100 + 1e-6) / 100);
}
