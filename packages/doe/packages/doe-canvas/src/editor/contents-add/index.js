/** Position editor chrome from the final rendered layout, never the requested columns. */
export function syncContentsAddButton(owner, outline) {
  const button = owner.querySelector(':scope > .doe-item-add');
  if (!button) return;
  const root = owner.closest('[data-component-type]');
  let vertical;
  if (root.dataset.timelineLayout) vertical = root.dataset.timelineLayout !== 'horizontal';
  else if (root.matches('.shape-contents')) vertical = ['stairs', 'pyramid', 'inverted-pyramid'].includes(root.dataset.variant);
  else vertical = Number(root.dataset.columns || root.querySelector('[data-columns]')?.dataset.columns || 1) === 1;
  button.dataset.addDirection = vertical ? 'bottom' : 'right';
  const { left, right, top, bottom } = outline.style;
  Object.assign(button.style, {
    left: vertical ? `calc(${left} + (100% - ${left} - ${right}) / 2)` : 'auto',
    right: vertical ? 'auto' : right,
    top: vertical ? 'auto' : `calc(${top} + (100% - ${top} - ${bottom}) / 2)`,
    bottom: vertical ? bottom : 'auto',
    transform: vertical ? 'translate(-50%, 50%)' : 'translate(50%, -50%)',
  });
}
