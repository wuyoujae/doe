import { layoutRadialContents } from './index.js';
import { COPY_BOUNDS, measureCopy } from '../../../../layout/flow/copy-bounds.js';
import { toPixels } from '../../../../layout/flow/contract.js';

const px = value => parseFloat(value) || 0;
// Keep the artwork's historical envelope independent of the copy's capacity.
const RADIAL_COPY_REFERENCE_HEIGHT = toPixels(COPY_BOUNDS.maximumHeightPt);
export const RADIAL_COPY_BODY_LINES = 2;

/** Two body lines plus one title line; only the overflowing copy may grow. */
export function layoutRadialCopy(root, options, availableHeight) {
  const copies = [...root.querySelectorAll('.shape-contents__copy')];
  const theme = getComputedStyle(root);
  const defaults = copies.map(copy => {
    const box = getComputedStyle(copy);
    let height = px(box.paddingTop) + px(box.paddingBottom);
    for (const [selector, token, lines] of [['.shape-contents__title', 'h4', 1], ['.shape-contents__text', 'large', RADIAL_COPY_BODY_LINES]]) {
      const field = copy.querySelector(selector), style = getComputedStyle(field);
      if (field.hidden) continue;
      // Font compression must not reduce the item's original two-line capacity.
      const font = px(theme.getPropertyValue(`--typography-${token}-size`)) * 96 / 72;
      const line = (px(style.lineHeight) / px(style.fontSize) || 1.2) * font;
      height += lines * line + px(style.marginTop) + px(style.marginBottom);
    }
    return Math.ceil(height);
  });
  const heights = [...defaults];
  const layout = () => {
    const artWidth = layoutRadialContents(root, { ...options, copyHeight: RADIAL_COPY_REFERENCE_HEIGHT, copyHeights: heights });
    // Width compensation must rewrap the original source before height is read.
    // Semantic layout preserves active editors and already truncated projections.
    root.ownerDocument.defaultView.SemanticTextLayout?.applyTree(root, { allowScale: false });
    return artWidth;
  };
  let artWidth = layout();
  if (!Number.isFinite(availableHeight)) return artWidth;
  const budget = Math.max(root.offsetHeight, availableHeight);
  // Heights only increase within this solve. A growth step can change a peer's
  // free width; revisit measured demand until stable, without accumulating state.
  for (let pass = 0; pass < Math.ceil(budget); pass++) {
    let changed = false;
    for (let i = 0; i < copies.length; i++) {
      const copy = copies[i];
      const bounds = measureCopy(copy, [...copy.querySelectorAll('.shape-contents__title,.shape-contents__text')], budget * 72 / 96);
      const previous = heights[i];
      // Search whole CSS pixels: a fractional upper budget with an integer
      // midpoint can otherwise repeat the lower endpoint forever.
      let low = previous, high = Math.max(low, Math.min(Math.floor(budget), Math.ceil(bounds.demand)));
      if (high === low) continue;
      heights[i] = high; artWidth = layout();
      if (root.offsetHeight > budget) {
        // Capacity belongs to this slot, not a fixed per-item height enum.
        // A taller label may rewrap peers, so every trial rechecks the whole root.
        while (high - low > 1) {
          const middle = Math.floor((low + high) / 2);
          heights[i] = middle; layout();
          if (root.offsetHeight <= budget) low = middle; else high = middle;
        }
        heights[i] = low; artWidth = layout();
      }
      changed ||= heights[i] > previous;
    }
    if (!changed) break;
  }
  return artWidth;
}
