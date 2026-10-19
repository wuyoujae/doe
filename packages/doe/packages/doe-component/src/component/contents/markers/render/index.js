import { itemIcon } from '../../../../shared/item-icon/index.js';

/** Automatic ordinals are decorative; authored titles and dates remain unchanged. */
export function appendMarkers(root, kind, { timeline = false, items = [] } = {}) {
  root.dataset.contentsMarkerLayout = timeline ? 'timeline' : 'inline';
  root.__items.forEach((item, index) => {
    const marker = root.ownerDocument.createElement('span');
    marker.className = `contents-marker contents-marker--${kind}`;
    marker.dataset.contentsMarker = kind;
    marker.setAttribute('aria-hidden', 'true');
    if (kind === 'number') { marker.dataset.itemIconIndex = String(index); marker.append(itemIcon(root.ownerDocument, items[index]?.icon, timeline ? 'ArrowRight' : 'CircleDot')); }
    (timeline ? item : item.querySelector('.item-cards__surface')).prepend(marker);
  });
  return root;
}
