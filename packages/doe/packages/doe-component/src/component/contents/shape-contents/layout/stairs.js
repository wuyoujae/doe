import { ICON_SIZE, sizeIcon, trapezoidIconLimit } from '../icon-fit/index.js';

const px = value => parseFloat(value) || 0;
const BASE_HEIGHT = 80;

/** Every step shares one scale and keeps its aspect ratio as content grows. */
export function layoutStairs(root, { slotWidth, gap, minimumCopy, availableHeight }) {
  const rows = [...root.querySelectorAll('.shape-contents__row')];
  if (!rows.length) return;
  const copies = rows.map(row => row.querySelector('.shape-contents__copy'));
  const widths = rows.map((_, i) => 480 / rows.length * (1 + i * 0.5));
  const baseGap = px(getComputedStyle(root).getPropertyValue('--space-6pt')) || 8;
  const baseTotal = rows.length * BASE_HEIGHT + (rows.length - 1) * baseGap;
  const width = Math.max(widths.at(-1) + gap + minimumCopy, slotWidth);
  root.style.width = `${width}px`;
  const maxScale = Math.max(1, Math.min(
    (width - gap - minimumCopy) / widths.at(-1),
    Number.isFinite(availableHeight) ? availableHeight / baseTotal : Infinity,
  ));
  const wrap = () => root.ownerDocument.defaultView.SemanticTextLayout?.applyTree(root, { allowScale: false });
  function place(scale) {
    rows.forEach((row, i) => {
      row.style.gridTemplateColumns = `${widths[i] * scale}px minmax(0, 1fr)`;
      row.style.minHeight = '0';
      row.style.height = copies[i].style.height = `${BASE_HEIGHT * scale}px`;
      row.style.marginBottom = `${i < rows.length - 1 ? baseGap * scale : 0}px`;
    });
    wrap();
  }
  function demand(copy) {
    const box = getComputedStyle(copy);
    let height = px(box.paddingTop) + px(box.paddingBottom);
    for (const field of copy.querySelectorAll('.shape-contents__title,.shape-contents__text')) {
      if (field.hidden) continue;
      const style = getComputedStyle(field);
      height += px(style.height) + px(style.marginTop) + px(style.marginBottom)
        + Math.max(0, field.scrollHeight - field.clientHeight);
    }
    return height;
  }
  let scale = 1;
  // Growth reduces copy width, so remeasure original semantic text at each step.
  // Each advance is at least one layout quantum; the real slot bounds the search.
  for (let pass = 0; pass < 32; pass++) {
    place(scale);
    const needed = Math.ceil(Math.max(...copies.map(demand)) * 64) / 64 / BASE_HEIGHT;
    const next = Math.min(maxScale, Math.max(scale, needed));
    if (next <= scale + 1e-7) break;
    scale = pass === 31 ? maxScale : next;
  }
  place(scale);
  // The first step is the narrowest; every step shares its icon size.
  const iconSize = Math.min(ICON_SIZE, trapezoidIconLimit({ top: 1, bottom: BASE_HEIGHT - 1, halfTop: widths[0] / 2 - 1, halfBottom: widths[0] / 2 - 1 }));
  rows.forEach((row, i) => {
    const svg = row.querySelector('svg'), label = svg.querySelector('.shape-contents__marker');
    const w = widths[i], h = BASE_HEIGHT;
    // A stable viewBox scales the path, rounded corners, stroke and icon together.
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.style.width = `${w * scale}px`; svg.style.height = `${h * scale}px`;
    let shape = svg.querySelector(':scope > path');
    if (!shape) { shape = root.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'path'); shape.setAttribute('class', 'shape-contents__shape'); svg.prepend(shape); }
    shape.setAttribute('d', `M6 1 H${w - 6} Q${w - 1} 1 ${w - 1} 6 V${h - 6} Q${w - 1} ${h - 1} ${w - 6} ${h - 1} H6 Q1 ${h - 1} 1 ${h - 6} V6 Q1 1 6 1Z`);
    label.setAttribute('transform', `translate(${w / 2} ${h / 2})`);
    sizeIcon(label, iconSize);
  });
  root.dataset.stairsScale = String(scale);
  root.dataset.stairsLimit = String(maxScale);
}
