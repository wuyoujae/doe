import { groupingHit } from '../drop-intent/index.js';
import { reduceGrouping } from '../../../edit/grouping/index.js';
import { queueMutation } from '../transaction/queue-mutation/index.js';
import { showDropIndicator } from '../../../../../../../doe-canvas/src/editor/drop-indicator/show/index.js';
import { clearDropIndicators } from '../../../../../../../doe-canvas/src/editor/clear-drop-indicators/index.js';
import { notify } from '../../../../../../../doe-core/src/operation/notify/index.js';
import { findLocation } from '../../../../../../../doe-core/src/operation/find-location/index.js';
import { groupingCollection } from '../../../../../../../doe-component/src/component/contents/contents/model/grouping/index.js';
import { updateSelection } from '../update-selection/index.js';

const labels = { reorder: '按落点插入', compose: '合为两列', detach: '移出此组', 'transfer-item': '适配目标样式并合入' };
export function attachGroupingDrag(handle, surface, reference, state) {
  if (!handle) return;
  handle.draggable = false;
  handle.style.touchAction = 'none';
  handle.addEventListener('dragstart', event => { event.preventDefault(); event.stopPropagation(); });
  handle.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    event.preventDefault(); event.stopPropagation();
    state.itemDragCleanup?.();
    state.selectedId = reference.blockId;
    state.selectedItem = reference.index == null ? null : { blockId: reference.blockId, index: reference.index,
      key: reference.itemId ? `id:${reference.itemId}` : `index:${reference.index}` };
    updateSelection(state);
    const doc = surface.ownerDocument, win = doc.defaultView;
    const initialBlocks = state.slide.blocks;
    let active = false, preview = null, signature = '', error = '';
    const identify = ref => {
      if (ref.index == null || ref.itemId) return ref;
      const collection = groupingCollection(findLocation(initialBlocks, ref.blockId)?.node);
      return { ...ref, snapshot: JSON.stringify(collection?.items[ref.index]) };
    };
    const source = identify(reference);
    const clear = () => {
      clearDropIndicators(state);
      state.slideElement?.querySelectorAll('[data-grouping-preview]').forEach(element => {
        delete element.dataset.groupingPreview; delete element.dataset.dropLabel; delete element.dataset.dropReason;
        element.classList.remove('is-drop-rejected');
      });
    };
    const cancel = () => {
      win.removeEventListener('pointermove', move, true);
      win.removeEventListener('pointerup', finish, true);
      win.removeEventListener('pointercancel', cancel, true);
      win.removeEventListener('blur', cancel);
      doc.removeEventListener('keydown', keydown, true);
      if (state.itemDragCleanup === cancel) state.itemDragCleanup = null;
      delete doc.documentElement.dataset.blockDragging;
      surface.classList.remove('is-dragging', 'is-item-dragging');
      state.slideElement?.classList.remove('is-block-dragging');
      clear();
    };
    const keydown = key => { if (key.key === 'Escape') { key.preventDefault(); key.stopPropagation(); cancel(); } };
    const move = pointer => {
      if (pointer.pointerId !== event.pointerId) return;
      if (state.disposed || !surface.isConnected || state.slide.blocks !== initialBlocks) { cancel(); return; }
      if (!active && Math.hypot(pointer.clientX - event.clientX, pointer.clientY - event.clientY) < 6) return;
      active = true; pointer.preventDefault();
      doc.documentElement.dataset.blockDragging = 'true';
      surface.classList.add(reference.index == null ? 'is-dragging' : 'is-item-dragging');
      state.slideElement.classList.add('is-block-dragging');
      const hit = groupingHit(state.slideElement, pointer.clientX, pointer.clientY, preview);
      const nextSignature = hit ? JSON.stringify([hit.reference, hit.edge]) : '';
      if (signature === nextSignature) return;
      signature = nextSignature; clear(); preview = null; error = '';
      if (!hit) return;
      const intent = { source, target: identify(hit.reference), edge: hit.edge };
      try {
        const candidate = reduceGrouping(state.slide.blocks, intent);
        if (!candidate.changed) return;
        preview = { ...hit, intent };
        hit.surface.dataset.groupingPreview = candidate.kind;
        hit.surface.dataset.dropLabel = labels[candidate.kind];
        showDropIndicator(hit.surface, hit.edge);
      } catch (reason) {
        error = reason.message;
        preview = { ...hit, intent: null };
        hit.surface.dataset.groupingPreview = 'rejected';
        hit.surface.dataset.dropLabel = error;
        hit.surface.dataset.dropReason = error;
        hit.surface.classList.add('is-drop-rejected');
      }
    };
    const finish = async pointer => {
      if (pointer.pointerId !== event.pointerId) return;
      move(pointer);
      const intent = preview?.intent, reason = error;
      cancel();
      if (!active) return;
      if (!intent) { if (reason) notify(state, { rejected: true, action: '拖动拆合组', reason }); return; }
      try {
        await state.activeTextEdit?.finish?.(true);
        if (state.activeTextEdit && !state.activeTextEdit.finished) return;
        // Re-resolve identities in the queued transaction. A preceding text
        // commit may rebuild the DOM; never commit the preview's cloned tree.
        const options = { grouping: true };
        await queueMutation(state, '拖动拆合组', () => {
          const result = reduceGrouping(state.slide.blocks, intent);
          if (!result.changed) return false;
          state.slide.blocks = result.blocks;
          state.selectedId = result.selectedId; state.selectedItem = result.selectedItem;
          options.grouping = result;
          return true;
        }, options);
      } catch (reason) { notify(state, { rejected: true, action: '拖动拆合组', reason: reason.message }); }
    };
    state.itemDragCleanup = cancel;
    win.addEventListener('pointermove', move, { capture: true, passive: false });
    win.addEventListener('pointerup', finish, true);
    win.addEventListener('pointercancel', cancel, true);
    win.addEventListener('blur', cancel);
    doc.addEventListener('keydown', keydown, true);
  });
}
