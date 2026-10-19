export function itemKey(value, index) {
  return value && typeof value === 'object' && value.id != null ? `id:${value.id}` : `index:${index}`;
}

/** Selection is editor state. It never becomes part of the document schema. */
export function syncItemSelection(state) {
  if (!state.slideElement) return;
  if (state.selectedItem?.blockId !== state.selectedId) state.selectedItem = null;
  const selection = state.selectedItem;
  let selected = null;
  state.slideElement.querySelectorAll('[data-item-selection-key]').forEach(item => {
    const active = Boolean(selection && item.dataset.itemOwnerId === selection.blockId && item.dataset.itemSelectionKey === selection.key);
    item.classList.toggle('is-item-selected', active);
    if (active) { item.setAttribute('aria-current', 'true'); selected = item; }
    else item.removeAttribute('aria-current');
  });
  state.slideElement.querySelectorAll('.block-shell.has-selected-item').forEach(shell => shell.classList.remove('has-selected-item'));
  if (selected) {
    selected.closest('.block-shell')?.classList.add('has-selected-item');
    selection.index = Number(selected.dataset.collectionItemIndex);
  } else state.selectedItem = null;
}
