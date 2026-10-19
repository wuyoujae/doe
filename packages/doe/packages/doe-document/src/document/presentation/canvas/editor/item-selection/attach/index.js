import { attachSelectionOutline } from '../../../../../../../../doe-canvas/src/editor/selection-outline/index.js';
import { itemKey } from '../state/index.js';
import { updateSelection } from '../../update-selection/index.js';
import { deleteButton } from '../../delete-content/index.js';

export function attachItemSelection(item, node, value, index, state) {
  const shell = item.closest('.block-shell');
  if (!shell || item.namespaceURI !== 'http://www.w3.org/1999/xhtml') return false;
  shell.classList.add('has-item-selection');
  const ownerHandle = shell.querySelector(':scope > .block-handle');
  if (ownerHandle) {
    ownerHandle.classList.remove('block-handle--element');
    ownerHandle.classList.add('block-handle--group');
    ownerHandle.dataset.gripIcon = 'vertical';
  }
  item.classList.add('doe-selectable-item');
  item.dataset.itemOwnerId = node.id;
  item.dataset.itemSelectionKey = itemKey(value, index);
  item.tabIndex = 0;
  attachSelectionOutline(item, true);
  const handle = item.ownerDocument.createElement('button');
  handle.type = 'button';
  handle.className = 'block-handle block-handle--element doe-item-handle';
  handle.dataset.gripIcon = 'horizontal';
  handle.dataset.slideExportIgnore = 'true';
  handle.setAttribute('aria-label', `内容项 ${index + 1}`);
  item.append(handle);
  const toolbar = item.ownerDocument.createElement('div');
  toolbar.className = 'block-toolbar block-toolbar--content doe-item-delete-toolbar';
  toolbar.setAttribute('role', 'toolbar');
  toolbar.dataset.slideExportIgnore = 'true';
  toolbar.append(deleteButton(state, { blockId: node.id, key: item.dataset.itemSelectionKey }));
  item.append(toolbar);
  const select = () => {
    state.selectedId = node.id;
    state.selectedItem = { blockId: node.id, key: item.dataset.itemSelectionKey, index: Number(item.dataset.collectionItemIndex) };
    updateSelection(state);
  };
  item.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.target.closest('[data-item-selection-key]') !== item) return;
    select();
    if (event.target.closest('.doe-item-handle') || !event.target.closest('[data-doe-text-path], [contenteditable], button')) item.focus({ preventScroll: true });
    // Text events continue to the existing field editor on the owning shell.
  });
  item.addEventListener('click', event => {
    if (event.target.closest('.block-toolbar')) return;
    if (event.target.closest('[data-item-selection-key]') !== item) return;
    event.stopPropagation(); select();
  });
  item.addEventListener('focus', select);
  item.addEventListener('keydown', event => {
    if (event.target !== item && event.target !== handle) return;
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(); }
    if (event.key === 'Escape') {
      event.preventDefault(); event.stopPropagation(); state.selectedItem = null; updateSelection(state); ownerHandle?.focus();
    }
  });
  return true;
}
