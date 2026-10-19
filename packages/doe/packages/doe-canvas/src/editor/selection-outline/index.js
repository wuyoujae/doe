import { syncContentsAddButton } from '../contents-add/index.js';
const corners = ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius'];

function surfaceFor(owner) {
  if (owner.classList.contains('block-shell')) {
    return owner.querySelector(':scope > .block-content > .component-card, :scope > .layout-group__content') || owner;
  }
  // The raised badge is part of the item, above the bordered card surface.
  if (owner.matches('.item-cards[data-variant="top-icon"] .item-cards__item:has(.item-cards__icon)')) return owner;
  return owner.querySelector(':scope > .item-cards__surface') || owner;
}

export function syncSelectionOutline(owner) {
  const outline = owner.querySelector(':scope > .doe-selection-outline');
  if (!outline || !owner.isConnected) return;
  const surface = surfaceFor(owner);
  // Connected cards paint the outer rounded boundary on their grid, not the
  // transparent collection wrapper. Individual cells retain their own corners.
  const roundedSurface = surface.matches('.item-cards[data-connected="true"]')
    ? surface.querySelector(':scope > .item-cards__grid') || surface : surface;
  const style = getComputedStyle(roundedSurface);
  const bordered = ['Top', 'Right', 'Bottom', 'Left'].every(side =>
    parseFloat(style[`border${side}Width`]) > 0 && !['none', 'hidden'].includes(style[`border${side}Style`]));
  const connected = surface.closest('.item-cards[data-connected="true"]');
  const rounded = corners.some(corner => parseFloat(style[corner]) > 0);
  for (const corner of corners) outline.style[corner] = bordered || connected || rounded ? style[corner] : 'var(--yrkie-radius-component)';
  const outer = owner.getBoundingClientRect(), inner = surface.getBoundingClientRect();
  const ownerStyle = getComputedStyle(owner);
  const px = name => parseFloat(ownerStyle[name]) || 0;
  const width = px('width') + (ownerStyle.boxSizing === 'border-box' ? 0 : px('paddingLeft') + px('paddingRight') + px('borderLeftWidth') + px('borderRightWidth'));
  const height = px('height') + (ownerStyle.boxSizing === 'border-box' ? 0 : px('paddingTop') + px('paddingBottom') + px('borderTopWidth') + px('borderBottomWidth'));
  const scaleX = outer.width / (width || outer.width || 1);
  const scaleY = outer.height / (height || outer.height || 1);
  // Insets follow subsequent reflow; stale fixed sizes would pollute scroll measurements.
  Object.assign(outline.style, {
    left: `${(inner.left - outer.left) / (scaleX || 1) - px('borderLeftWidth')}px`, top: `${(inner.top - outer.top) / (scaleY || 1) - px('borderTopWidth')}px`,
    right: `${(outer.right - inner.right) / (scaleX || 1) - px('borderRightWidth')}px`, bottom: `${(outer.bottom - inner.bottom) / (scaleY || 1) - px('borderBottomWidth')}px`,
  });
  const handle=owner.querySelector(':scope > .block-handle--element');
  if(handle) {
    handle.style.top=`${parseFloat(outline.style.top)+.5}px`;
    if(!handle.style.right && !owner.matches('[data-connector="top"]'))handle.style.left=`calc(${outline.style.left} + (100% - ${outline.style.left} - ${outline.style.right}) / 2)`;
  }
  syncContentsAddButton(owner, outline);
}

export function attachSelectionOutline(owner, item = false) {
  owner.classList.add('has-selection-outline');
  const outline = owner.ownerDocument.createElement('span');
  outline.className = `doe-selection-outline${item ? ' doe-item-selection-outline' : ''}`;
  outline.dataset.slideExportIgnore = 'true';
  outline.setAttribute('aria-hidden', 'true');
  owner.append(outline);
  owner.addEventListener('pointerenter', () => syncSelectionOutline(owner));
}

export function syncSelectionOutlines(root) {
  root?.querySelectorAll('.has-selection-outline').forEach(syncSelectionOutline);
}
