import { canDeleteContent, deleteContent } from '../../../edit/delete-content/index.js';
import { queueMutation } from '../transaction/queue-mutation/index.js';
import { toolbarIconButton } from '../../../layout/toolbar-icon-button/index.js';
import { updateSelection } from '../update-selection/index.js';

export async function requestDelete(state, target) {
  if (!state.slide.editor || state.mode && state.mode !== 'editable' || state.deletingContent) return;
  state.deletingContent = true;
  try {
    await state.activeTextEdit?.finish?.(true);
    if (state.activeTextEdit && !state.activeTextEdit.finished) return;
    await queueMutation(state, '删除内容', () => deleteContent(state, target));
    updateSelection(state);
    state.slideElement?.querySelector('.is-item-selected')?.focus({ preventScroll: true });
  } finally { state.deletingContent = false; }
}

export function deleteButton(state, target) {
  const button = toolbarIconButton('Trash2', '删除');
  button.querySelector('.text-edit-toolbar__button-label')?.remove();
  button.dataset.deleteContent = 'true';
  button.disabled = !canDeleteContent(state, target);
  if (button.disabled) button.title = target.key != null ? '已达到最少内容项数' : '本页至少保留一个组件';
  button.addEventListener('pointerdown', event => { event.preventDefault(); event.stopPropagation(); });
  button.addEventListener('click', event => {
    event.preventDefault(); event.stopPropagation();
    void requestDelete(state, target);
  });
  return button;
}

export function appendDeleteButton(shell, node, state) {
  if (!state.slide.editor) return;
  let toolbar = shell.querySelector(':scope > .block-toolbar');
  if (!toolbar) {
    toolbar = shell.ownerDocument.createElement('div');
    toolbar.className = 'block-toolbar block-toolbar--content';
    toolbar.setAttribute('role', 'toolbar');
    shell.append(toolbar);
  }
  toolbar.append(deleteButton(state, { blockId: node.id }));
}

export function installDeletionKeyboard(state) {
  const doc = state.host.ownerDocument;
  const keydown = event => {
    if (event.defaultPrevented || event.repeat || event.isComposing || event.ctrlKey || event.metaKey || event.altKey || !['Delete', 'Backspace'].includes(event.key)) return;
    if (!state.slide.editor || !state.selectedId || state.disposed || state.dragId) return;
    const target = event.target;
    if (target.closest?.('input,textarea,select,[contenteditable="true"],[contenteditable="plaintext-only"],dialog,[role="dialog"]')) return;
    if (!state.host.contains(target)) return;
    event.preventDefault(); event.stopPropagation();
    void requestDelete(state, state.selectedItem ? { ...state.selectedItem } : { blockId: state.selectedId });
  };
  doc.addEventListener('keydown', keydown);
  return () => doc.removeEventListener('keydown', keydown);
}
