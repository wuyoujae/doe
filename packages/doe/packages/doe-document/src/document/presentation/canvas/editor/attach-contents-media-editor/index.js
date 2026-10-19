import { scope } from '../../../runtime/context/index.js';
import { findLocation } from '../../../../../../../doe-core/src/operation/find-location/index.js';
import { notify } from '../../../../../../../doe-core/src/operation/notify/index.js';
import { queueMutation } from '../transaction/queue-mutation/index.js';

export function attachContentsMediaEditor(root, node, state) {
  const bridge = scope.global.DOEContentEditor;
  if (!state.slide.editor || !bridge?.open || node.type !== 'contents' || node.props.presentation !== 'image-text') return;
  root.querySelectorAll('[data-contents-image-index]').forEach(target => {
    target.setAttribute('role', 'button'); target.tabIndex = 0;
    target.setAttribute('aria-label', bridge.labels?.replace || '替换图片');
  });
  const fieldAt = event => event.target.closest('[data-contents-image-index]');
  root.addEventListener('pointerdown', event => {
    if (fieldAt(event)) { event.preventDefault(); event.stopPropagation(); }
  }, true);
  const open = async event => {
    const target = fieldAt(event);
    if (!target) return;
    event.preventDefault(); event.stopPropagation();
    const index = Number(target.dataset.contentsImageIndex);
    try {
      await state.activeTextEdit?.finish?.(true); await state.queue;
      const current = findLocation(state.slide.blocks, node.id)?.node;
      if (!current || state.disposed) return;
      const original = JSON.stringify(current.props.items[index]);
      const item = current.props.items[index];
      bridge.open({ type: 'media', props: { src: item.src || '', alt: item.alt || '', fit: current.props.imageFit || 'contain', aspectRatio: current.props.imageAspectRatio || '1:1' }, element: target,
        async apply(draft) {
          if (!draft.src) return;
          await queueMutation(state, '替换内容项图片', () => {
            const latest = findLocation(state.slide.blocks, node.id)?.node;
            if (!latest || JSON.stringify(latest.props.items[index]) !== original) throw new Error('内容项已变化，请重新打开');
            latest.props.items[index] = { ...latest.props.items[index], src: draft.src, alt: draft.alt || '' };
            return true;
          });
          if (state.report?.rejectedAction === '替换内容项图片') throw new Error('空间不足，图片替换已撤回');
        },
      });
    } catch (error) { notify(state, { rejected: true, action: '替换内容项图片', reason: error.message }); }
  };
  root.addEventListener('click', open, true);
  root.addEventListener('keydown', event => { if (['Enter', ' '].includes(event.key)) void open(event); }, true);
}
