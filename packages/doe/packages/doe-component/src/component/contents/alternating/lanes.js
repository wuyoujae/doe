import { toPixels } from '../../../layout/flow/contract.js';
import { COPY_BOUNDS } from '../../../layout/flow/copy-bounds.js';

/** Opposite sides share height; same-side boxes and ordered markers never overlap. */
export function fitTimelineLanes(demands, minimums, markers, budget, gap) {
  function pack(heights) {
    const tops = [], ends = [0, 0];
    let previous = 0;
    heights.forEach((height, index) => {
      const side = index % 2;
      const ordered = index ? previous + (markers[index - 1] + markers[index]) / 2 + gap - height / 2 : 0;
      const top = Math.max(0, index > 1 ? ends[side] + gap : 0, ordered);
      tops.push(top); ends[side] = top + height; previous = top + height / 2;
    });
    return { tops, height: Math.max(0, ...ends) };
  }
  const full = pack(demands);
  let heights = [...demands], result = full;
  if (full.height > budget) {
    let low = 0, high = Math.max(0, ...demands);
    // A bounded water-fill search reserves complete titles plus a body line.
    for (let pass = 0; pass < 32; pass++) {
      const limit = (low + high) / 2;
      const trial = demands.map((demand, i) => Math.max(minimums[i], Math.min(demand, limit)));
      if (pack(trial).height <= budget) low = limit; else high = limit;
    }
    heights = demands.map((demand, i) => Math.max(minimums[i], Math.min(demand, low)));
    result = pack(heights);
  }
  return { ...result, heights, fullHeight: full.height };
}

export function clearTimelineLanes(root) {
  delete root.dataset.timelineLanes;
  root.querySelector('.item-cards__grid').style.height = '';
  for (const item of root.__items) for (const name of ['top', 'left', 'width', 'height']) item.style[name] = '';
}

export function layoutTimelineLanes(root, node, context) {
  clearTimelineLanes(root);
  if (!context.flowLayout || root.dataset.timelineLayout !== 'alternating' || node.props.items.length < 2) return;
  const grid = root.querySelector('.item-cards__grid'), css = getComputedStyle(grid);
  const width = (grid.clientWidth - parseFloat(css.columnGap)) / 2;
  const gap = toPixels(COPY_BOUNDS.gapPt);
  root.dataset.timelineLanes = 'true';
  root.__items.forEach((item, index) => {
    item.style.width = `${width}px`;
    item.style.left = `${index % 2 ? grid.clientWidth - width : 0}px`;
  });
  root.ownerDocument.defaultView.SemanticTextLayout?.applyTree(root, { allowScale: false });
  const px = value => parseFloat(value) || 0;
  const demands = [], minimums = [], markers = [];
  root.__items.forEach(item => {
    const surface = item.querySelector('.item-cards__surface'), style = getComputedStyle(surface);
    const scale = surface.getBoundingClientRect().width / Math.max(1, px(style.width));
    let demand = px(style.paddingTop) + px(style.paddingBottom) + px(style.borderTopWidth) + px(style.borderBottomWidth);
    let minimum = demand;
    for (const field of surface.querySelectorAll('.item-cards__title,.item-cards__text')) {
      if (field.hidden) continue;
      const s = getComputedStyle(field), height = field.getBoundingClientRect().height / scale;
      const margin = px(s.marginTop) + px(s.marginBottom);
      demand += height + margin;
      minimum += (field.matches('.item-cards__title') ? height : Math.min(height, px(s.lineHeight))) + margin;
    }
    const marker = item.querySelector('.contents-marker');
    const markerHeight = marker ? marker.getBoundingClientRect().height / scale : 0;
    demands.push(Math.max(demand, markerHeight)); minimums.push(Math.max(minimum, markerHeight)); markers.push(markerHeight);
  });
  const natural = fitTimelineLanes(demands, minimums, markers, Infinity, gap);
  const budget = Math.max(0, context.contentHeightBudget ?? context.availableHeight ?? natural.height);
  const layout = fitTimelineLanes(demands, minimums, markers, budget, gap);
  // Use spare slot height without returning to one full-width row per item.
  const serial = demands.reduce((sum, height) => sum + height, 0) + gap * (demands.length - 1);
  const height = context.contentHeightBudget == null ? layout.height : Math.max(layout.height, Math.min(serial, budget));
  const spare = height - layout.height;
  grid.style.height = `${height}px`;
  root.__items.forEach((item, index) => {
    item.style.top = `${layout.tops[index] + spare * index / (root.__items.length - 1)}px`;
    item.style.height = `${layout.heights[index]}px`;
  });
}
