import { icon } from '../icon/index.js';

// Only neighbors in the same row share an icon; wrapping never adds one.
export function arrangeConnectors(root, columns) {
  if (root.dataset.variant !== 'connected-icon') return;
  const items = root.__items;
  items.forEach(item => item.querySelectorAll('.item-cards__icon').forEach(badge => badge.remove()));
  for (let start = 0; start < items.length; start += columns) {
    const count = Math.min(columns, items.length - start);
    for (let j = 0; j < count; j++) {
      const index = start + j, item = items[index];
      const surface = item.querySelector('.item-cards__surface');
      if (j > 0) {
        const badge = root.ownerDocument.createElement('span');
        badge.className = 'item-cards__icon';
        badge.setAttribute('contenteditable', 'false');
        badge.dataset.connectorEdge = 'left';
        badge.dataset.connectorIconIndex = String(index);
        badge.append(icon(root.__connectorIcons[index] || 'Sparkles'));
        surface.append(badge);
      }
      item.dataset.connector = j ? 'left' : 'none';
    }
  }
}
