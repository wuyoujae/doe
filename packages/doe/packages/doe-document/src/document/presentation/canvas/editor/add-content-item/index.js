import { additionInfo, addContentItem } from '../../../edit/add-content-item/index.js';
import { queueMutation } from '../transaction/queue-mutation/index.js';
import { toolbarIconButton } from '../../../layout/toolbar-icon-button/index.js';

export function appendAddContentButton(root, node, state) {
  if (!state.slide.editor || state.mode && state.mode !== 'editable') return;
  const info = additionInfo(state, node.id);
  if (!info) return;
  const item = [...root.querySelectorAll('[data-collection-item-index]')]
    .find(item => Number(item.dataset.collectionItemIndex) === info.values.length - 1);
  if (!item?.classList.contains('doe-selectable-item')) return;
  const button = toolbarIconButton('Plus', '新增内容项');
  button.className = 'doe-item-add';
  button.querySelector('.text-edit-toolbar__button-label')?.remove();
  button.dataset.slideExportIgnore = 'true';
  button.disabled = info.values.length >= info.maximum;
  if (button.disabled) button.title = `最多支持 ${info.maximum} 个内容项`;
  button.addEventListener('pointerdown', event => { event.preventDefault(); event.stopPropagation(); });
  button.addEventListener('click', async event => {
    event.preventDefault(); event.stopPropagation();
    if (state.addingContent || state.disposed) return;
    state.addingContent = true;
    try {
      await state.activeTextEdit?.finish?.(true);
      if (state.activeTextEdit && !state.activeTextEdit.finished) return;
      await queueMutation(state, '新增内容项', () => addContentItem(state, node.id));
      if (state.disposed) return;
      const current = state.leafRecords.find(record => record.node.id === node.id)?.element;
      if (state.report?.rejectedAction === '新增内容项') {
        const hint = root.ownerDocument.createElement('span');
        hint.className = 'doe-item-add-hint';
        hint.dataset.slideExportIgnore = 'true';
        hint.setAttribute('role', 'alert');
        hint.textContent = '空间不足：已尝试自动排版和压缩，无法添加新内容项。';
        current?.querySelector('.doe-item-add')?.parentElement.append(hint);
      } else current?.querySelector('.is-item-selected')?.focus({ preventScroll: true });
    } finally { state.addingContent = false; }
  });
  item.append(button);
}
