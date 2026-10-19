import { toPixels } from './contract.js';

/** Author-facing limits are slide points; CSS geometry is converted here. */
export const COPY_BOUNDS = Object.freeze({ minimumWidthEm: 8, maximumHeightPt: 120, maximumExtraLines: 1, gapPt: 6 });
const px = value => parseFloat(value) || 0;

/** A whole final line may borrow spare space. The exception never accumulates
 * across passes and is never used to fit only part of that line. */
export function copyHeightLimit(demand, lastLine, maximum = toPixels(COPY_BOUNDS.maximumHeightPt)) {
  return demand > maximum && demand <= maximum + lastLine * COPY_BOUNDS.maximumExtraLines ? demand : maximum;
}

export function boundedCopyHeight(bounds, available = Infinity) {
  const limit = available >= bounds.demand ? bounds.limit : bounds.maximum;
  return Math.max(0, Math.min(bounds.demand, limit, available));
}

export function copyMinimumWidth(root, body) {
  const theme = getComputedStyle(root);
  const defaultPt = px(theme.getPropertyValue('--typography-large-size'));
  return COPY_BOUNDS.minimumWidthEm * (defaultPt ? toPixels(defaultPt) : px(getComputedStyle(body).fontSize));
}

export function measureCopy(copy, fields, maximumHeightPt = COPY_BOUNDS.maximumHeightPt) {
  const box = getComputedStyle(copy);
  let demand = px(box.paddingTop) + px(box.paddingBottom) + px(box.borderTopWidth) + px(box.borderBottomWidth);
  let minimum = demand, lastLine = 0;
  fields.filter(field => field && !field.hidden).forEach((field, index) => {
    const style = getComputedStyle(field), height = Math.max(field.getBoundingClientRect().height /
      (copy.getBoundingClientRect().width / Math.max(1, px(box.width))), field.scrollHeight);
    const margin = px(style.marginTop) + px(style.marginBottom);
    const line = px(style.lineHeight) || px(style.fontSize) * 1.2;
    lastLine = line;
    demand += height + margin;
    minimum += (index === 0 ? height : Math.min(height, line)) + margin;
  });
  const maximum = toPixels(maximumHeightPt);
  const limit = copyHeightLimit(demand, lastLine, maximum);
  return { demand, minimum, maximum, limit, height: Math.min(limit, demand) };
}

/** Least squared displacement from preferred anchors, preserving order and gap.
 * A negative slack is an explicit capacity conflict, never overlapping labels. */
export function packCopy(heights, preferred, available, gap = toPixels(COPY_BOUNDS.gapPt)) {
  const required = heights.reduce((sum, height) => sum + height, 0) + Math.max(0, heights.length - 1) * gap;
  const prefix = [], pools = [];
  let used = 0;
  heights.forEach((height, i) => {
    prefix.push(used);
    pools.push({ start: i, end: i, sum: preferred[i] - used, count: 1 });
    while (pools.length > 1) {
      const b = pools.at(-1), a = pools.at(-2);
      if (a.sum / a.count <= b.sum / b.count) break;
      pools.splice(-2, 2, { start: a.start, end: b.end, sum: a.sum + b.sum, count: a.count + b.count });
    }
    used += height + gap;
  });
  const positions = [], slack = Math.max(0, available - required);
  for (const pool of pools) {
    const offset = Math.max(0, Math.min(slack, pool.sum / pool.count));
    for (let i = pool.start; i <= pool.end; i++) positions[i] = prefix[i] + offset;
  }
  return { positions, required, fits: required <= available + 1 / 64 };
}

/** Water-fill bounded boxes. Short items keep their demand; long items share
 * remaining room before fonts change. The measured overflow remains visible. */
export function copyCapacities(demands, available) {
  const result = [...demands];
  let pending = demands.map((_, index) => index), remaining = Math.max(0, available);
  while (pending.length) {
    const share = remaining / pending.length, small = pending.filter(index => demands[index] <= share);
    if (!small.length) { pending.forEach(index => { result[index] = share; }); break; }
    small.forEach(index => { remaining -= demands[index]; });
    pending = pending.filter(index => !small.includes(index));
  }
  return result;
}
